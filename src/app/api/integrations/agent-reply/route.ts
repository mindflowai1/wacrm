// ============================================================
// POST /api/integrations/agent-reply
//
// The return leg of the AI customer-service loop (Phase 3). The
// external agent (n8n) calls this after generating a reply. It:
//   1. authenticates via the shared INTEGRATION_API_KEY (Bearer),
//   2. sends the reply to the customer through the Meta Cloud API,
//   3. persists it to the inbox as a `bot` message,
// so the conversation stays the single source of truth and a human
// can see (and take over) at any time.
//
// Auth is an API key — NOT a user cookie — because the caller is a
// server-to-server integration with no Supabase session. All DB
// access goes through the service-role client (RLS bypassed), so the
// key IS the security boundary: keep it secret.
//
// Body:
//   { "conversation_id": "<uuid>", "text": "free text" }            // within 24h window
//   { "conversation_id": "<uuid>", "template_name": "...",          // outside 24h window
//     "language": "en_US", "params": ["..."] }
// ============================================================

import { NextResponse } from "next/server";
import crypto from "crypto";

import { supabaseAdmin } from "@/lib/flows/admin-client";
import { sendTextMessage, sendTemplateMessage } from "@/lib/whatsapp/meta-api";
import { decrypt } from "@/lib/whatsapp/encryption";
import { sanitizePhoneForMeta, isValidE164 } from "@/lib/whatsapp/phone-utils";
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import type { MessageTemplate } from "@/types";
import { isMessageTemplate } from "@/lib/whatsapp/template-row-guard";

/**
 * Constant-time comparison of the Bearer token against the configured
 * key. Returns false when the env var is unset so the endpoint is
 * closed by default (never an open relay).
 */
function isAuthorized(request: Request): boolean {
  const expected = process.env.INTEGRATION_API_KEY;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : header;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch — guard first so a
  // length difference doesn't leak via an exception path.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        conversation_id?: unknown;
        text?: unknown;
        template_name?: unknown;
        language?: unknown;
        params?: unknown;
      }
    | null;

  if (!body || typeof body.conversation_id !== "string") {
    return NextResponse.json(
      { error: "conversation_id is required" },
      { status: 400 },
    );
  }

  const conversationId = body.conversation_id;
  const templateName =
    typeof body.template_name === "string" && body.template_name.length > 0
      ? body.template_name
      : null;
  const text = typeof body.text === "string" ? body.text : "";

  if (!templateName && !text.trim()) {
    return NextResponse.json(
      { error: "Provide 'text' (within the 24h window) or 'template_name'" },
      { status: 400 },
    );
  }

  // Bound runaway loops on the agent side (e.g. an n8n workflow that
  // accidentally replies to its own bot messages). Keyed per
  // conversation so one chatty thread can't starve the rest.
  const limit = checkRateLimit(`agent-reply:${conversationId}`, RATE_LIMITS.send);
  if (!limit.success) return rateLimitResponse(limit);

  const db = supabaseAdmin();

  // Resolve the conversation → account + contact phone.
  const { data: conversation, error: convErr } = await db
    .from("conversations")
    .select("id, account_id, contact:contacts(id, phone)")
    .eq("id", conversationId)
    .maybeSingle();

  if (convErr || !conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 },
    );
  }

  const contact = Array.isArray(conversation.contact)
    ? conversation.contact[0]
    : conversation.contact;
  if (!contact?.phone) {
    return NextResponse.json(
      { error: "Contact phone not found" },
      { status: 400 },
    );
  }

  const to = sanitizePhoneForMeta(contact.phone);
  if (!isValidE164(to)) {
    return NextResponse.json(
      { error: "Invalid contact phone number" },
      { status: 400 },
    );
  }

  // WhatsApp config for the conversation's account.
  const { data: config, error: cfgErr } = await db
    .from("whatsapp_config")
    .select("phone_number_id, access_token")
    .eq("account_id", conversation.account_id)
    .maybeSingle();

  if (cfgErr || !config) {
    return NextResponse.json(
      { error: "WhatsApp is not configured for this account" },
      { status: 400 },
    );
  }

  const accessToken = decrypt(config.access_token);
  const language = typeof body.language === "string" ? body.language : "en_US";

  // Send via Meta.
  let waMessageId = "";
  try {
    if (templateName) {
      // Load the row so media headers / buttons are built correctly.
      let templateRow: MessageTemplate | null = null;
      const { data } = await db
        .from("message_templates")
        .select("*")
        .eq("account_id", conversation.account_id)
        .eq("name", templateName)
        .eq("language", language)
        .maybeSingle();
      if (data && isMessageTemplate(data)) templateRow = data;

      const result = await sendTemplateMessage({
        phoneNumberId: config.phone_number_id,
        accessToken,
        to,
        templateName,
        language,
        template: templateRow ?? undefined,
        params: Array.isArray(body.params) ? body.params.map(String) : [],
      });
      waMessageId = result.messageId;
    } else {
      const result = await sendTextMessage({
        phoneNumberId: config.phone_number_id,
        accessToken,
        to,
        text,
      });
      waMessageId = result.messageId;
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown Meta API error";
    console.error("[agent-reply] Meta send failed:", message);
    return NextResponse.json(
      { error: `Meta API error: ${message}` },
      { status: 502 },
    );
  }

  // Persist as a `bot` message so the AI reply shows in the inbox.
  const { data: messageRecord, error: msgErr } = await db
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_type: "bot",
      content_type: templateName ? "template" : "text",
      content_text: templateName ? null : text,
      template_name: templateName,
      message_id: waMessageId,
      status: "sent",
    })
    .select("id")
    .single();

  if (msgErr) {
    console.error("[agent-reply] message insert failed:", msgErr);
    return NextResponse.json(
      {
        error: "Sent to Meta but failed to save to the inbox",
        whatsapp_message_id: waMessageId,
      },
      { status: 500 },
    );
  }

  await db
    .from("conversations")
    .update({
      last_message_text: templateName ? `[template: ${templateName}]` : text,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  return NextResponse.json({
    ok: true,
    message_id: messageRecord.id,
    whatsapp_message_id: waMessageId,
  });
}

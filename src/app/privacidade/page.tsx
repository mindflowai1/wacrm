import type { Metadata } from "next";

import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Política de Privacidade — MindflowCRM",
};

// Atualize esta data sempre que revisar o documento.
const ULTIMA_ATUALIZACAO = "21 de junho de 2026";

export default function PrivacidadePage() {
  return (
    <LegalShell
      title="Política de Privacidade"
      updated={ULTIMA_ATUALIZACAO}
      intro="Esta Política descreve como o MindflowCRM coleta, usa, compartilha e protege dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)."
    >
      <LegalSection title="1. Quem Somos">
        <p>
          O MindflowCRM é operado por [Razão Social], inscrita no CNPJ sob o nº
          [CNPJ], com sede em [Endereço] (“nós”). Para fins desta Política, somos
          o controlador dos dados de cadastro e uso da Plataforma, e operador dos
          dados que você (Usuário) trata por meio dela.
        </p>
      </LegalSection>

      <LegalSection title="2. Definições (LGPD)">
        <p>
          “Dado pessoal”: informação relacionada a pessoa natural identificada ou
          identificável. “Titular”: a pessoa a quem se referem os dados.
          “Tratamento”: qualquer operação com dados pessoais. “Controlador”: quem
          decide sobre o tratamento. “Operador”: quem trata em nome do
          controlador.
        </p>
      </LegalSection>

      <LegalSection title="3. Dados que Coletamos">
        <p>
          (a) <strong>Dados de cadastro</strong>: nome, e-mail e credenciais de
          acesso. (b) <strong>Dados de pagamento</strong>: processados
          diretamente pela Stripe; não armazenamos dados completos de cartão. (c){" "}
          <strong>Dados de uso</strong>: registros de acesso, logs técnicos e
          configurações da conta. (d) <strong>Dados dos seus Contatos</strong>:
          números de telefone, nomes, mensagens e demais informações que você
          insere ou recebe via WhatsApp e armazena na Plataforma.
        </p>
      </LegalSection>

      <LegalSection title="4. Finalidades e Bases Legais">
        <p>
          Tratamos dados para: fornecer e operar o Serviço; processar
          pagamentos; prestar suporte; garantir segurança e prevenir fraudes;
          cumprir obrigações legais; e aprimorar a Plataforma. As bases legais
          (art. 7º da LGPD) incluem a execução de contrato, o cumprimento de
          obrigação legal, o legítimo interesse e, quando aplicável, o
          consentimento do titular.
        </p>
      </LegalSection>

      <LegalSection title="5. Papéis: Controlador e Operador">
        <p>
          Em relação aos dados dos <strong>Contatos</strong> (clientes finais),
          você é o <strong>controlador</strong> e o MindflowCRM atua como{" "}
          <strong>operador</strong>, tratando esses dados conforme suas instruções
          e exclusivamente para viabilizar o Serviço. Cabe a você assegurar base
          legal e informar adequadamente seus Contatos sobre o tratamento.
        </p>
      </LegalSection>

      <LegalSection title="6. Compartilhamento e Subprocessadores">
        <p>
          Não vendemos dados pessoais. Compartilhamos dados apenas com
          prestadores que viabilizam o Serviço, atuando como suboperadores, entre
          eles: Supabase (banco de dados e autenticação), Stripe (pagamentos),
          Meta/WhatsApp (envio e recebimento de mensagens) e o provedor do fluxo
          de automação/IA configurado. Cada um trata os dados conforme suas
          próprias políticas e nas finalidades aqui descritas.
        </p>
      </LegalSection>

      <LegalSection title="7. Direitos do Titular">
        <p>
          Nos termos do art. 18 da LGPD, o titular pode solicitar: confirmação da
          existência de tratamento; acesso aos dados; correção de dados
          incompletos ou desatualizados; anonimização, bloqueio ou eliminação de
          dados desnecessários ou tratados em desconformidade; portabilidade;
          informação sobre compartilhamento; e revogação do consentimento.
          Solicitações de titulares que sejam Contatos de um Usuário devem,
          quando aplicável, ser direcionadas ao respectivo Usuário (controlador).
        </p>
      </LegalSection>

      <LegalSection title="8. Segurança">
        <p>
          Adotamos medidas técnicas e organizacionais para proteger os dados,
          incluindo criptografia de credenciais sensíveis, isolamento de dados
          por conta (RLS), controle de acesso e comunicação por canais seguros
          (HTTPS). Nenhum sistema é totalmente imune a riscos; em caso de
          incidente de segurança relevante, adotaremos as providências previstas
          na LGPD.
        </p>
      </LegalSection>

      <LegalSection title="9. Retenção e Eliminação">
        <p>
          Mantemos os dados pelo tempo necessário às finalidades descritas ou ao
          cumprimento de obrigações legais. Encerrada a conta, os dados poderão
          ser eliminados ou anonimizados, ressalvadas as hipóteses de guarda
          obrigatória.
        </p>
      </LegalSection>

      <LegalSection title="10. Transferência Internacional">
        <p>
          Alguns prestadores podem processar dados fora do Brasil. Nesses casos,
          buscamos garantir que a transferência ocorra com salvaguardas adequadas,
          conforme a LGPD.
        </p>
      </LegalSection>

      <LegalSection title="11. Cookies">
        <p>
          Utilizamos cookies e tecnologias semelhantes estritamente necessários
          para autenticação e funcionamento da Plataforma. Você pode gerenciar
          cookies nas configurações do seu navegador, ciente de que isso pode
          afetar o uso do Serviço.
        </p>
      </LegalSection>

      <LegalSection title="12. Encarregado (DPO) e Contato">
        <p>
          Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de
          dados, entre em contato com nosso Encarregado pela Proteção de Dados em
          [e-mail do DPO]. Responderemos no prazo legal.
        </p>
      </LegalSection>

      <LegalSection title="13. Alterações desta Política">
        <p>
          Esta Política pode ser atualizada periodicamente. Alterações relevantes
          serão comunicadas pelos canais usuais, e a data de “última atualização”
          acima será revisada.
        </p>
      </LegalSection>
    </LegalShell>
  );
}

import type { Metadata } from "next";

import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Termos de Uso — MindflowCRM",
};

// Atualize esta data sempre que revisar o documento.
const ULTIMA_ATUALIZACAO = "21 de junho de 2026";

export default function TermosPage() {
  return (
    <LegalShell
      title="Termos de Uso"
      updated={ULTIMA_ATUALIZACAO}
      intro="Estes Termos de Uso regem o acesso e a utilização da plataforma MindflowCRM. Ao criar uma conta ou usar o serviço, você declara ter lido, compreendido e concordado com todas as condições abaixo."
    >
      <LegalSection title="1. Definições">
        <p>
          “Serviço” ou “Plataforma”: o sistema MindflowCRM, incluindo o painel
          web, as integrações e as funcionalidades disponibilizadas. “Nós”,
          “nosso” ou “Empresa”: [Razão Social], inscrita no CNPJ sob o nº
          [CNPJ], com sede em [Endereço]. “Você”, “Usuário” ou “Cliente”: a
          pessoa física ou jurídica que contrata e/ou utiliza o Serviço.
          “Contatos”: os dados de terceiros (clientes finais do Usuário) tratados
          por meio da Plataforma.
        </p>
      </LegalSection>

      <LegalSection title="2. Descrição do Serviço">
        <p>
          O MindflowCRM é uma plataforma de CRM integrada à API oficial do
          WhatsApp Business (Meta), que oferece caixa de entrada compartilhada,
          gestão de contatos, funis de vendas, transmissões, automações e
          atendimento assistido por inteligência artificial. O Serviço é
          fornecido “no estado em que se encontra”, podendo evoluir, ter recursos
          adicionados ou descontinuados a nosso critério.
        </p>
      </LegalSection>

      <LegalSection title="3. Cadastro e Conta">
        <p>
          Para usar o Serviço, você deve fornecer informações verdadeiras,
          completas e atualizadas. Você é o único responsável pela
          confidencialidade das credenciais de acesso e por todas as atividades
          realizadas em sua conta. Notifique-nos imediatamente em caso de uso não
          autorizado.
        </p>
      </LegalSection>

      <LegalSection title="4. Planos, Pagamento e Cancelamento">
        <p>
          O Serviço é oferecido mediante assinatura recorrente, processada pela
          Stripe. Ao assinar, você autoriza a cobrança periódica conforme o plano
          escolhido. Os valores podem ser reajustados mediante aviso prévio. A
          assinatura é renovada automaticamente até que seja cancelada por você,
          a qualquer momento, pelo portal de gerenciamento. O cancelamento
          encerra a renovação seguinte; o acesso permanece ativo até o fim do
          período já pago, salvo disposição em contrário. Tributos eventualmente
          incidentes são de responsabilidade do Usuário.
        </p>
      </LegalSection>

      <LegalSection title="5. Uso Aceitável">
        <p>
          Você concorda em não utilizar o Serviço para: (a) enviar spam,
          mensagens não solicitadas ou em desacordo com a legislação aplicável;
          (b) praticar atos ilícitos, fraudulentos ou que violem direitos de
          terceiros; (c) transmitir conteúdo ofensivo, discriminatório ou
          ilegal; (d) tentar comprometer a segurança, a integridade ou a
          disponibilidade da Plataforma. O descumprimento poderá resultar em
          suspensão ou encerramento da conta.
        </p>
      </LegalSection>

      <LegalSection title="6. WhatsApp, Meta e Integrações de Terceiros">
        <p>
          O Serviço integra-se à API do WhatsApp Business e a outros serviços de
          terceiros. O MindflowCRM não é afiliado, patrocinado ou endossado pela
          Meta Platforms, Inc. Você é responsável por cumprir as políticas da
          Meta e do WhatsApp (incluindo políticas de mensagens e de comércio) e
          por manter as autorizações e números utilizados. A indisponibilidade ou
          alteração de serviços de terceiros pode afetar o funcionamento da
          Plataforma, sem que isso configure descumprimento por nossa parte.
        </p>
      </LegalSection>

      <LegalSection title="7. Dados dos Contatos e Privacidade">
        <p>
          No tratamento dos dados dos seus Contatos, você atua como controlador e
          o MindflowCRM como operador, nos termos da LGPD. Você declara possuir
          base legal adequada para tratar tais dados e para enviá-los à
          Plataforma. O tratamento de dados pessoais é detalhado na{" "}
          <a
            href="/privacidade"
            className="text-primary hover:text-primary/80"
          >
            Política de Privacidade
          </a>
          , que integra estes Termos.
        </p>
      </LegalSection>

      <LegalSection title="8. Propriedade Intelectual">
        <p>
          Todos os direitos sobre a Plataforma, seu código, marca, layout e
          conteúdo pertencem à Empresa ou a seus licenciadores. Estes Termos não
          concedem qualquer direito de propriedade, apenas uma licença limitada,
          não exclusiva e intransferível de uso enquanto vigente a assinatura. Os
          dados que você insere permanecem seus.
        </p>
      </LegalSection>

      <LegalSection title="9. Disponibilidade e Suporte">
        <p>
          Empenhamo-nos para manter o Serviço disponível, mas não garantimos
          operação ininterrupta ou livre de erros. Manutenções, atualizações ou
          fatores externos podem causar indisponibilidades temporárias. O suporte
          é prestado pelos canais indicados na Plataforma.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitação de Responsabilidade">
        <p>
          Na máxima extensão permitida pela lei, a Empresa não se responsabiliza
          por danos indiretos, lucros cessantes, perda de dados ou prejuízos
          decorrentes do uso ou da impossibilidade de uso do Serviço, de serviços
          de terceiros ou de conteúdo transmitido pelos Usuários. Nossa
          responsabilidade total, quando cabível, limita-se ao valor pago pelo
          Usuário nos 3 (três) meses anteriores ao evento.
        </p>
      </LegalSection>

      <LegalSection title="11. Suspensão e Encerramento">
        <p>
          Podemos suspender ou encerrar o acesso em caso de violação destes
          Termos, inadimplência ou uso indevido. Você pode encerrar sua conta a
          qualquer momento. Após o encerramento, os dados poderão ser excluídos
          conforme a Política de Privacidade e a legislação aplicável.
        </p>
      </LegalSection>

      <LegalSection title="12. Alterações nos Termos">
        <p>
          Podemos atualizar estes Termos periodicamente. Alterações relevantes
          serão comunicadas pelos canais usuais. O uso continuado do Serviço após
          a vigência das alterações representa concordância com a nova versão.
        </p>
      </LegalSection>

      <LegalSection title="13. Lei Aplicável e Foro">
        <p>
          Estes Termos são regidos pelas leis da República Federativa do Brasil.
          Fica eleito o foro da comarca de [Cidade/UF] para dirimir quaisquer
          controvérsias, com renúncia a qualquer outro, por mais privilegiado que
          seja.
        </p>
      </LegalSection>

      <LegalSection title="14. Contato">
        <p>
          Dúvidas sobre estes Termos podem ser enviadas para [e-mail de contato].
        </p>
      </LegalSection>
    </LegalShell>
  );
}

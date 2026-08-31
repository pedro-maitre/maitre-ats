export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.SMTP_FROM || "Maître Conecta <onboarding@resend.dev>";

    if (resendApiKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          html,
          text: text || subject,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Erro ao enviar e-mail via Resend API");
      }

      console.log(`[E-mail Enviado via Resend] ID: ${data.id} para ${to}`);
      return { success: true, messageId: data.id };
    } else {
      // Modo Simulação Resiliente (Dev & Sandbox)
      console.log(`\n================= [SIMULAÇÃO DE E-MAIL TRANSACIONAL] =================`);
      console.log(`Para: ${to}`);
      console.log(`Assunto: ${subject}`);
      console.log(`Corpo (HTML preview): ${html.substring(0, 250)}...`);
      console.log(`======================================================================\n`);
      return { success: true, simulated: true };
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Erro no Envio de E-mail]:", err);
    return { success: false, error: err.message };
  }
}

// Layout Base de E-mail HTML Maître
function getBaseEmailTemplate(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" style="max-width:600px;background-color:#1e293b;border-radius:20px;border:1px solid #334155;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #1d1e20 0%, #0f172a 100%);padding:30px;text-align:center;border-bottom:3px solid #D4AF37;">
              <h1 style="margin:0;font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                Maître<span style="color:#D4AF37;">Conecta</span>
              </h1>
              <p style="margin:5px 0 0 0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">
                Executive Search & ATS Intelligence
              </p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px 30px;">
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#0f172a;padding:25px 30px;text-align:center;border-top:1px solid #334155;">
              <p style="margin:0;font-size:12px;color:#64748b;">
                © ${new Date().getFullYear()} Maître Consultoria & Talent Acquisition. Todos os direitos reservados.
              </p>
              <p style="margin:8px 0 0 0;font-size:11px;color:#475569;">
                Esta é uma mensagem automática de processo seletivo. Por favor, não responda diretamente a este e-mail.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// 1. Convite para Entrevista
export async function sendInterviewEmail(params: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  scheduledAt: Date | string;
  format?: string;
  meetingUrl?: string;
  notes?: string;
}) {
  const formattedDate = new Date(params.scheduledAt).toLocaleString("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const content = `
    <h2 style="color:#ffffff;font-size:20px;font-weight:800;margin-top:0;">
      Olá, ${params.candidateName}!
    </h2>
    <p style="font-size:15px;line-height:1.6;color:#cbd5e1;">
      Temos o prazer de convidar você para uma entrevista para a oportunidade de 
      <strong style="color:#D4AF37;">${params.jobTitle}</strong> na empresa 
      <strong style="color:#ffffff;">${params.companyName}</strong> conduzida pela equipe Maître.
    </p>

    <div style="background-color:#0f172a;border-radius:14px;border:1px solid #334155;padding:20px;margin:25px 0;">
      <p style="margin:0 0 10px 0;font-size:14px;color:#94a3b8;">
        📅 <strong>Data e Horário:</strong> <span style="color:#ffffff;">${formattedDate}</span>
      </p>
      <p style="margin:0 0 10px 0;font-size:14px;color:#94a3b8;">
        📍 <strong>Formato:</strong> <span style="color:#ffffff;">${params.format === "IN_PERSON" ? "Presencial" : "Videoconferência Online"}</span>
      </p>
      ${
        params.meetingUrl
          ? `<p style="margin:0 0 10px 0;font-size:14px;color:#94a3b8;">
              🔗 <strong>Link da Reunião:</strong> <a href="${params.meetingUrl}" style="color:#38bdf8;text-decoration:none;font-weight:bold;" target="_blank">${params.meetingUrl}</a>
            </p>`
          : ""
      }
      ${
        params.notes
          ? `<p style="margin:0;font-size:13px;color:#94a3b8;border-top:1px solid #1e293b;padding-top:10px;">
              📝 <strong>Orientações:</strong> ${params.notes}
            </p>`
          : ""
      }
    </div>

    ${
      params.meetingUrl
        ? `<div style="text-align:center;margin:30px 0;">
            <a href="${params.meetingUrl}" style="background:linear-gradient(135deg, #D4AF37 0%, #e5c07b 100%);color:#0f172a;text-decoration:none;padding:14px 30px;border-radius:12px;font-weight:800;font-size:15px;display:inline-block;" target="_blank">
              Acessar Sala de Entrevista
            </a>
          </div>`
        : ""
    }

    <p style="font-size:14px;line-height:1.6;color:#94a3b8;margin-bottom:0;">
      Desejamos muito sucesso na sua preparação! Caso precise remarcar, entre em contato com seu consultor de recrutamento.
    </p>
  `;

  return sendEmail({
    to: params.candidateEmail,
    subject: `📅 Convite para Entrevista: ${params.jobTitle} - ${params.companyName}`,
    html: getBaseEmailTemplate("Convite para Entrevista", content),
  });
}

// 2. Notificação de Proposta Salarial
export async function sendOfferEmail(params: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  salaryOffered: number;
  employmentType?: string;
  benefits?: string;
}) {
  const formattedSalary = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(params.salaryOffered);

  const content = `
    <h2 style="color:#ffffff;font-size:20px;font-weight:800;margin-top:0;">
      🎉 Parabéns, ${params.candidateName}!
    </h2>
    <p style="font-size:15px;line-height:1.6;color:#cbd5e1;">
      É com imensa satisfação que informamos que você foi selecionado(a) para a posição de 
      <strong style="color:#D4AF37;">${params.jobTitle}</strong> na <strong style="color:#ffffff;">${params.companyName}</strong>!
    </p>

    <div style="background-color:#0f172a;border-radius:14px;border:1px solid #334155;padding:22px;margin:25px 0;">
      <h3 style="margin:0 0 15px 0;font-size:16px;color:#D4AF37;font-weight:bold;">
        Resumo da Proposta de Contratação
      </h3>
      <p style="margin:0 0 10px 0;font-size:15px;color:#94a3b8;">
        💵 <strong>Remuneração Proposta:</strong> <span style="color:#10b981;font-weight:bold;font-size:16px;">${formattedSalary}</span> (${params.employmentType || "CLT"})
      </p>
      ${
        params.benefits
          ? `<p style="margin:0;font-size:14px;color:#94a3b8;">
              🎁 <strong>Pacote de Benefícios:</strong> <span style="color:#ffffff;">${params.benefits}</span>
            </p>`
          : ""
      }
    </div>

    <p style="font-size:14px;line-height:1.6;color:#cbd5e1;">
      Seu consultor de Talent Acquisition da Maître entrará em contato para alinhar os próximos passos e envio de documentação.
    </p>
  `;

  return sendEmail({
    to: params.candidateEmail,
    subject: `🎉 Proposta de Contratação: ${params.jobTitle} - ${params.companyName}`,
    html: getBaseEmailTemplate("Proposta de Contratação", content),
  });
}

// 3. Convite de Gestor do Cliente (Hiring Manager)
export async function sendHiringManagerInviteEmail(params: {
  managerName: string;
  managerEmail: string;
  companyName: string;
  tempPassword: string;
  loginUrl: string;
}) {
  const content = `
    <h2 style="color:#ffffff;font-size:20px;font-weight:800;margin-top:0;">
      Bem-vindo(a) ao Portal do Gestor, ${params.managerName}!
    </h2>
    <p style="font-size:15px;line-height:1.6;color:#cbd5e1;">
      A Maître Consultoria criou seu acesso corporativo exclusivo para acompanhar os processos seletivos e candidatos finalistas da <strong style="color:#D4AF37;">${params.companyName}</strong>.
    </p>

    <div style="background-color:#0f172a;border-radius:14px;border:1px solid #334155;padding:20px;margin:25px 0;">
      <p style="margin:0 0 10px 0;font-size:14px;color:#94a3b8;">
        👤 <strong>Usuário:</strong> <span style="color:#ffffff;font-weight:bold;">${params.managerEmail}</span>
      </p>
      <p style="margin:0;font-size:14px;color:#94a3b8;">
        🔑 <strong>Senha Temporária:</strong> <span style="color:#38bdf8;font-family:monospace;font-weight:bold;font-size:15px;">${params.tempPassword}</span>
      </p>
    </div>

    <div style="text-align:center;margin:30px 0;">
      <a href="${params.loginUrl}" style="background:linear-gradient(135deg, #D4AF37 0%, #e5c07b 100%);color:#0f172a;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:800;font-size:15px;display:inline-block;" target="_blank">
        Acessar Portal do Gestor
      </a>
    </div>

    <p style="font-size:13px;line-height:1.6;color:#64748b;margin-bottom:0;">
      Por segurança, recomendamos que altere sua senha no primeiro acesso ao sistema.
    </p>
  `;

  return sendEmail({
    to: params.managerEmail,
    subject: `🔐 Acesso ao Portal do Gestor - Maître Conecta (${params.companyName})`,
    html: getBaseEmailTemplate("Acesso ao Portal do Gestor", content),
  });
}

// 4. E-mail de Boas-Vindas & Admissão Digital do Novo Contratado
export async function sendAdmissionWelcomeEmail(params: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  admissionUrl: string;
}) {
  const content = `
    <h2 style="color:#ffffff;font-size:20px;font-weight:800;margin-top:0;">
      🎉 Seja bem-vindo(a) à equipe, ${params.candidateName}!
    </h2>
    <p style="font-size:15px;line-height:1.6;color:#cbd5e1;">
      Sua contratação para a oportunidade de <strong style="color:#D4AF37;">${params.jobTitle}</strong> na empresa <strong style="color:#ffffff;">${params.companyName}</strong> foi aprovada com sucesso!
    </p>
    <p style="font-size:15px;line-height:1.6;color:#cbd5e1;">
      Para darmos seguimento à sua admissão e emissão do contrato de trabalho, disponibilizamos um portal exclusivo e seguro para envio dos seus dados cadastrais e documentos obrigatórios.
    </p>

    <div style="background-color:#0f172a;border-radius:14px;border:1px solid #334155;padding:22px;margin:25px 0;text-align:center;">
      <p style="margin:0 0 15px 0;font-size:14px;color:#94a3b8;">
        Clique no botão abaixo para acessar sua ficha de admissão digital:
      </p>
      <a href="${params.admissionUrl}" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:800;font-size:15px;display:inline-block;box-shadow:0 10px 15px -3px rgba(16, 185, 129, 0.3);" target="_blank">
        📂 Acessar Portal de Admissão Digital
      </a>
      <p style="margin:15px 0 0 0;font-size:12px;color:#64748b;">
        Ambiente protegido com criptografia de ponta a ponta e integridade SHA-256.
      </p>
    </div>

    <p style="font-size:13px;line-height:1.6;color:#94a3b8;margin-bottom:0;">
      Caso tenha alguma dúvida referente aos documentos solicitados, responda ao seu consultor de RH ou utilize os canais oficiais de suporte da Maître.
    </p>
  `;

  return sendEmail({
    to: params.candidateEmail,
    subject: `🚀 Admissão Digital: Seja bem-vindo(a) à ${params.companyName}!`,
    html: getBaseEmailTemplate("Portal de Admissão Digital", content),
  });
}

// 5. Notificação de Exigência / Reenvio de Documento de Admissão
export async function sendAdmissionRequirementEmail(params: {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  admissionUrl: string;
  requirementNotes: string;
}) {
  const content = `
    <h2 style="color:#ffffff;font-size:20px;font-weight:800;margin-top:0;">
      Olá, ${params.candidateName}
    </h2>
    <p style="font-size:15px;line-height:1.6;color:#cbd5e1;">
      Durante a análise dos documentos para sua admissão na vaga <strong style="color:#D4AF37;">${params.jobTitle}</strong> (${params.companyName}), o Departamento Pessoal identificou uma pendência que precisa da sua atenção:
    </p>

    <div style="background-color:#7f1d1d20;border-radius:14px;border:1px solid #ef444450;padding:20px;margin:25px 0;">
      <h3 style="margin:0 0 8px 0;font-size:14px;color:#f87171;font-weight:bold;">
        ⚠️ Ajuste Solicitado pelo DP:
      </h3>
      <p style="margin:0;font-size:14px;color:#fca5a5;line-height:1.6;">
        ${params.requirementNotes}
      </p>
    </div>

    <div style="text-align:center;margin:30px 0;">
      <a href="${params.admissionUrl}" style="background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%);color:#0f172a;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:800;font-size:15px;display:inline-block;" target="_blank">
        Corrigir / Reenviar Documento
      </a>
    </div>
  `;

  return sendEmail({
    to: params.candidateEmail,
    subject: `⚠️ Ação Necessária: Ajuste na Documentação de Admissão - ${params.companyName}`,
    html: getBaseEmailTemplate("Ajuste na Documentação de Admissão", content),
  });
}


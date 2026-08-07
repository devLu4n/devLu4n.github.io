const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");

const ses = new SESv2Client({
  region: process.env.AWS_REGION || "us-east-2",
  maxAttempts: 3,
});

async function enviarRedefinicaoSenha({ destinatario, nome, resetUrl }) {
  const remetente = process.env.SES_FROM_EMAIL;
  if (!remetente) {
    if (process.env.NODE_ENV !== "production") return { resetUrl };
    throw new Error("SES_FROM_EMAIL nao foi configurado.");
  }

  const command = new SendEmailCommand({
    FromEmailAddress: remetente,
    Destination: { ToAddresses: [destinatario] },
    Content: {
      Simple: {
        Subject: { Data: "Redefinicao de senha do Aladin", Charset: "UTF-8" },
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: `Ola, ${nome}.\n\nUse o link abaixo para criar uma nova senha. Ele expira em 15 minutos e pode ser usado uma unica vez.\n\n${resetUrl}\n\nSe voce nao solicitou a redefinicao, ignore esta mensagem.`,
          },
          Html: {
            Charset: "UTF-8",
            Data: `<p>Ola, ${escapeHtml(nome)}.</p><p>Use o link abaixo para criar uma nova senha. Ele expira em 15 minutos e pode ser usado uma unica vez.</p><p><a href="${escapeHtml(resetUrl)}">Redefinir minha senha</a></p><p>Se voce nao solicitou a redefinicao, ignore esta mensagem.</p>`,
          },
        },
      },
    },
  });

  return ses.send(command);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

module.exports = { enviarRedefinicaoSenha };

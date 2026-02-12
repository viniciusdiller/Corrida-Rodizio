export async function sendPasswordResetCodeEmail(params: {
  to: string;
  code: string;
  username: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const subject = "Código de redefinição de senha";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.5; color:#111;">
      <h2>Redefinição de senha</h2>
      <p>Olá <strong>${params.username}</strong>,</p>
      <p>Seu código de redefinição é:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:6px;">${params.code}</p>
      <p>Ele expira em 15 minutos.</p>
      <p>Se você não solicitou, ignore este e-mail.</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MeChama <noreply@mechama.eu>",
      to: [params.to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend error: ${response.status} ${body}`);
  }
}

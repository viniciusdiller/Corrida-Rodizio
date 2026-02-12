const APP_BASE_URL = "https://rodiziorace.mechama.eu";

export async function sendWelcomeEmail(params: {
  to: string;
  username: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const logoUrl = `${APP_BASE_URL}/logo-big-light.png`;
  const subject = "Bem-vindo ao Rodízio Race!";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.5; color:#111; max-width:560px; margin:0 auto;">
      <div style="text-align:center; margin-bottom:24px;">
        <img src="${logoUrl}" alt="Rodízio Race" style="max-width:220px; width:100%; height:auto;" />
      </div>
      <h2 style="margin-bottom:12px;">Bem-vindo ao Rodízio Race 🎉</h2>
      <p>Olá <strong>${params.username}</strong>,</p>
      <p>Sua conta foi criada com sucesso. Estamos felizes em te ver por aqui!</p>
      <p>
        Guarde seu username para entrar novamente no jogo:
        <strong style="font-size:18px;">${params.username}</strong>
      </p>
      <p>Nos vemos na próxima corrida. 🚀</p>
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

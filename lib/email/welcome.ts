const APP_BASE_URL = "https://rodiziorace.mechama.eu";

type SupportedLanguage = "pt" | "en" | "es" | "fr";

const WELCOME_COPY: Record<SupportedLanguage, {
  subject: string;
  heading: string;
  greeting: string;
  accountCreated: string;
  saveUsername: string;
  seeYouSoon: string;
}> = {
  pt: {
    subject: "Bem-vindo ao Rodízio Race!",
    heading: "Bem-vindo ao Rodízio Race 🎉",
    greeting: "Olá",
    accountCreated: "Sua conta foi criada com sucesso. Estamos felizes em te ver por aqui!",
    saveUsername: "Guarde seu username para entrar novamente no jogo:",
    seeYouSoon: "Nos vemos na próxima corrida. 🚀",
  },
  en: {
    subject: "Welcome to Rodízio Race!",
    heading: "Welcome to Rodízio Race 🎉",
    greeting: "Hi",
    accountCreated: "Your account has been created successfully. We're happy to have you here!",
    saveUsername: "Save your username to sign in again:",
    seeYouSoon: "See you at the next race. 🚀",
  },
  es: {
    subject: "¡Bienvenido a Rodízio Race!",
    heading: "¡Bienvenido a Rodízio Race 🎉!",
    greeting: "Hola",
    accountCreated: "Tu cuenta fue creada con éxito. ¡Estamos felices de tenerte aquí!",
    saveUsername: "Guarda tu nombre de usuario para volver a entrar al juego:",
    seeYouSoon: "Nos vemos en la próxima carrera. 🚀",
  },
  fr: {
    subject: "Bienvenue sur Rodízio Race !",
    heading: "Bienvenue sur Rodízio Race 🎉",
    greeting: "Bonjour",
    accountCreated: "Votre compte a été créé avec succès. Nous sommes ravis de vous voir ici !",
    saveUsername: "Gardez votre nom d'utilisateur pour vous reconnecter au jeu :",
    seeYouSoon: "On se retrouve à la prochaine course. 🚀",
  },
};

const normalizeLanguage = (language?: string): SupportedLanguage => {
  const normalizedLanguage = (language ?? "").trim().toLowerCase();
  if (normalizedLanguage === "pt" || normalizedLanguage === "en" || normalizedLanguage === "es" || normalizedLanguage === "fr") {
    return normalizedLanguage;
  }

  return "pt";
};

export async function sendWelcomeEmail(params: {
  to: string;
  username: string;
  language?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const language = normalizeLanguage(params.language);
  const copy = WELCOME_COPY[language];
  const logoUrl = `${APP_BASE_URL}/logo-big-light.png`;
  const subject = copy.subject;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.5; color:#111; max-width:560px; margin:0 auto;">
      <div style="text-align:center; margin-bottom:24px;">
        <img src="${logoUrl}" alt="Rodízio Race" style="max-width:220px; width:100%; height:auto;" />
      </div>
      <h2 style="margin-bottom:12px;">${copy.heading}</h2>
      <p>${copy.greeting} <strong>${params.username}</strong>,</p>
      <p>${copy.accountCreated}</p>
      <p>
        ${copy.saveUsername}
        <strong style="font-size:18px;">${params.username}</strong>
      </p>
      <p>${copy.seeYouSoon}</p>
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

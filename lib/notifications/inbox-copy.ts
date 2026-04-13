import type { Language } from "@/lib/i18n/translations";

type NotificationCopy = {
  body: string;
  title: string;
};

type PromoOptions = {
  credits: number;
  promoCount: number;
};

const buildCopy: Record<Language, NotificationCopy> = {
  pt: {
    title: "Atualizacao importante no app",
    body: "Tem novidade no Rodizio Race. Veja a versao mais recente do app.",
  },
  en: {
    title: "Important app update",
    body: "There is something new in Rodizio Race. Check the latest app version.",
  },
  es: {
    title: "Actualizacion importante de la app",
    body: "Hay novedades en Rodizio Race. Mira la version mas reciente de la app.",
  },
  fr: {
    title: "Mise a jour importante de l'app",
    body: "Il y a du nouveau dans Rodizio Race. Consultez la derniere version.",
  },
};

const recoveryCopy: Record<Language, NotificationCopy> = {
  pt: {
    title: "Adicione um e-mail de recuperacao",
    body: "Proteja sua conta adicionando um e-mail de recuperacao nas configuracoes.",
  },
  en: {
    title: "Add a recovery email",
    body: "Protect your account by adding a recovery email in settings.",
  },
  es: {
    title: "Agrega un correo de recuperacion",
    body: "Protege tu cuenta agregando un correo de recuperacion en ajustes.",
  },
  fr: {
    title: "Ajoutez un e-mail de recuperation",
    body: "Protegez votre compte en ajoutant un e-mail de recuperation dans les reglages.",
  },
};

const promoCopy = {
  pt: {
    avatars: (count: number) =>
      count === 1
        ? "Voce desbloqueou 1 avatar promocional."
        : `Voce desbloqueou ${count} avatares promocionais.`,
    credits: (count: number) =>
      count === 1
        ? "Voce tem 1 credito premium disponivel."
        : `Voce tem ${count} creditos premium disponiveis.`,
    mixed: (credits: number, avatars: number) =>
      `${credits} creditos premium e ${avatars} avatares promocionais estao esperando por voce.`,
    title: "Novidade promocional",
  },
  en: {
    avatars: (count: number) =>
      count === 1
        ? "You unlocked 1 promotional avatar."
        : `You unlocked ${count} promotional avatars.`,
    credits: (count: number) =>
      count === 1
        ? "You have 1 premium credit available."
        : `You have ${count} premium credits available.`,
    mixed: (credits: number, avatars: number) =>
      `${credits} premium credits and ${avatars} promotional avatars are waiting for you.`,
    title: "Promotional update",
  },
  es: {
    avatars: (count: number) =>
      count === 1
        ? "Desbloqueaste 1 avatar promocional."
        : `Desbloqueaste ${count} avatares promocionales.`,
    credits: (count: number) =>
      count === 1
        ? "Tienes 1 credito premium disponible."
        : `Tienes ${count} creditos premium disponibles.`,
    mixed: (credits: number, avatars: number) =>
      `${credits} creditos premium y ${avatars} avatares promocionales te estan esperando.`,
    title: "Novedad promocional",
  },
  fr: {
    avatars: (count: number) =>
      count === 1
        ? "Vous avez debloque 1 avatar promotionnel."
        : `Vous avez debloque ${count} avatars promotionnels.`,
    credits: (count: number) =>
      count === 1
        ? "Vous avez 1 credit premium disponible."
        : `Vous avez ${count} credits premium disponibles.`,
    mixed: (credits: number, avatars: number) =>
      `${credits} credits premium et ${avatars} avatars promotionnels vous attendent.`,
    title: "Nouveaute promotionnelle",
  },
} satisfies Record<
  Language,
  {
    avatars: (count: number) => string;
    credits: (count: number) => string;
    mixed: (credits: number, avatars: number) => string;
    title: string;
  }
>;

export function getBuildUpdateCopy(language: Language, versionLabel?: string): NotificationCopy {
  const base = buildCopy[language] ?? buildCopy.pt;
  if (!versionLabel) {
    return base;
  }

  return {
    title: base.title,
    body: `${base.body} ${versionLabel}`.trim(),
  };
}

export function getRecoveryEmailCopy(language: Language): NotificationCopy {
  return recoveryCopy[language] ?? recoveryCopy.pt;
}

export function getPromoCopy(
  language: Language,
  { credits, promoCount }: PromoOptions,
): NotificationCopy | null {
  const localized = promoCopy[language] ?? promoCopy.pt;

  if (credits > 0 && promoCount > 0) {
    return {
      title: localized.title,
      body: localized.mixed(credits, promoCount),
    };
  }

  if (credits > 0) {
    return {
      title: localized.title,
      body: localized.credits(credits),
    };
  }

  if (promoCount > 0) {
    return {
      title: localized.title,
      body: localized.avatars(promoCount),
    };
  }

  return null;
}

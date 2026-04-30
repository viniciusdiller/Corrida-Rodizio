import type { Language } from "@/lib/i18n/translations";

type NotificationCopy = {
  body: string;
  title: string;
};

const buildCopy: Record<Language, NotificationCopy> = {
  pt: {
    title: "Atualização importante no app",
    body: "Tem novidade no Rodízio Race. Veja a versão mais recente do app.",
  },
  en: {
    title: "Important app update",
    body: "There is something new in Rodizio Race. Check the latest app version.",
  },
  es: {
    title: "Actualización importante de la app",
    body: "Hay novedades en Rodizio Race. Mira la versión más reciente de la app.",
  },
  fr: {
    title: "Mise à jour importante de l'app",
    body: "Il y a du nouveau dans Rodizio Race. Consultez la dernière version.",
  },
};

const recoveryCopy: Record<Language, NotificationCopy> = {
  pt: {
    title: "Adicione um e-mail de recuperação",
    body: "Proteja sua conta adicionando um e-mail de recuperação nas configurações.",
  },
  en: {
    title: "Add a recovery email",
    body: "Protect your account by adding a recovery email in settings.",
  },
  es: {
    title: "Agrega un correo de recuperación",
    body: "Protege tu cuenta agregando un correo de recuperación en ajustes.",
  },
  fr: {
    title: "Ajoutez un e-mail de récupération",
    body: "Protégez votre compte en ajoutant un e-mail de récupération dans les réglages.",
  },
};

const avatarRewardCopy = {
  pt: {
    body: (count: number) =>
      count === 1
        ? "Você recebeu 1 avatar ou crédito premium para usar."
        : `Você recebeu ${count} avatares ou créditos premium para usar.`,
    title: "Novo avatar recebido",
  },
  en: {
    body: (count: number) =>
      count === 1
        ? "You received 1 avatar or premium credit to use."
        : `You received ${count} avatars or premium credits to use.`,
    title: "New avatar received",
  },
  es: {
    body: (count: number) =>
      count === 1
        ? "Recibiste 1 avatar o crédito premium para usar."
        : `Recibiste ${count} avatares o créditos premium para usar.`,
    title: "Nuevo avatar recibido",
  },
  fr: {
    body: (count: number) =>
      count === 1
        ? "Vous avez reçu 1 avatar ou crédit premium à utiliser."
        : `Vous avez reçu ${count} avatars ou crédits premium à utiliser.`,
    title: "Nouvel avatar reçu",
  },
} satisfies Record<
  Language,
  {
    body: (count: number) => string;
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

export function getAvatarRewardCopy(
  language: Language,
  count: number,
): NotificationCopy | null {
  if (count <= 0) return null;
  const localized = avatarRewardCopy[language] ?? avatarRewardCopy.pt;
  return {
    title: localized.title,
    body: localized.body(count),
  };
}

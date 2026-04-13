import type { Language } from "@/lib/i18n/translations";

type NotificationCopy = {
  body: string;
  title: string;
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

const avatarCodeCopy = {
  pt: {
    body: (count: number) =>
      count === 1
        ? "Voce ganhou permissao para distribuir 1 avatar promocional."
        : `Voce ganhou permissao para distribuir ${count} avatares promocionais.`,
    title: "Permissao de avatar",
  },
  en: {
    body: (count: number) =>
      count === 1
        ? "You can now give 1 promotional avatar code."
        : `You can now give ${count} promotional avatar codes.`,
    title: "Avatar code access",
  },
  es: {
    body: (count: number) =>
      count === 1
        ? "Ahora puedes dar 1 codigo de avatar promocional."
        : `Ahora puedes dar ${count} codigos de avatar promocional.`,
    title: "Permiso de avatar",
  },
  fr: {
    body: (count: number) =>
      count === 1
        ? "Vous pouvez maintenant offrir 1 code d'avatar promotionnel."
        : `Vous pouvez maintenant offrir ${count} codes d'avatar promotionnel.`,
    title: "Acces avatar",
  },
} satisfies Record<
  Language,
  {
    body: (count: number) => string;
    title: string;
  }
>;

const avatarRewardCopy = {
  pt: {
    body: (count: number) =>
      count === 1
        ? "Voce recebeu 1 avatar ou credito premium para usar."
        : `Voce recebeu ${count} avatares ou creditos premium para usar.`,
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
        ? "Recibiste 1 avatar o credito premium para usar."
        : `Recibiste ${count} avatares o creditos premium para usar.`,
    title: "Nuevo avatar recibido",
  },
  fr: {
    body: (count: number) =>
      count === 1
        ? "Vous avez recu 1 avatar ou credit premium a utiliser."
        : `Vous avez recu ${count} avatars ou credits premium a utiliser.`,
    title: "Nouvel avatar recu",
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

export function getAvatarCodeAccessCopy(
  language: Language,
  count: number,
): NotificationCopy | null {
  if (count <= 0) return null;
  const localized = avatarCodeCopy[language] ?? avatarCodeCopy.pt;
  return {
    title: localized.title,
    body: localized.body(count),
  };
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

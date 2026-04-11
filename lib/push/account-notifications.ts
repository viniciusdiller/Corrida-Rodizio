import { createAdminClient } from "@/lib/supabase/admin";
import { buildRoomInvitePath, normalizeInviteLanguage } from "@/lib/utils/room-invite";
import {
  sendPushToSubscriptions,
  type PushMessage,
  type PushSubscriptionRecord,
} from "@/lib/push/web-push";

type SupportedLanguage = "pt" | "en" | "es" | "fr";

type NotificationPayload =
  | {
      type: "race-ended";
      roomCode: string;
    }
  | {
      type: "race-reopened";
      roomCode: string;
    }
  | {
      type: "photo-added";
      roomCode: string;
      actorName: string;
    }
  | {
      type: "lead-gained";
      roomCode: string;
    }
  | {
      type: "lead-lost";
      roomCode: string;
    };

const copy: Record<
  NotificationPayload["type"],
  Record<
    SupportedLanguage,
    {
      title: (payload: NotificationPayload) => string;
      body: (payload: NotificationPayload) => string;
    }
  >
> = {
  "race-ended": {
    pt: {
      title: () => "Corrida encerrada",
      body: ({ roomCode }) => `A sala ${roomCode} acabou de ser encerrada.`,
    },
    en: {
      title: () => "Race ended",
      body: ({ roomCode }) => `Room ${roomCode} has just been closed.`,
    },
    es: {
      title: () => "Carrera terminada",
      body: ({ roomCode }) => `La sala ${roomCode} acaba de cerrarse.`,
    },
    fr: {
      title: () => "Course terminee",
      body: ({ roomCode }) => `La salle ${roomCode} vient d'etre fermee.`,
    },
  },
  "race-reopened": {
    pt: {
      title: () => "Corrida reaberta",
      body: ({ roomCode }) => `A sala ${roomCode} esta valendo de novo.`,
    },
    en: {
      title: () => "Race reopened",
      body: ({ roomCode }) => `Room ${roomCode} is live again.`,
    },
    es: {
      title: () => "Carrera reabierta",
      body: ({ roomCode }) => `La sala ${roomCode} vuelve a estar activa.`,
    },
    fr: {
      title: () => "Course rouverte",
      body: ({ roomCode }) => `La salle ${roomCode} est de nouveau active.`,
    },
  },
  "photo-added": {
    pt: {
      title: () => "Nova foto na timeline",
      body: ({ actorName, roomCode }) =>
        `${actorName} acabou de mandar uma foto na sala ${roomCode}.`,
    },
    en: {
      title: () => "New timeline photo",
      body: ({ actorName, roomCode }) =>
        `${actorName} just added a photo in room ${roomCode}.`,
    },
    es: {
      title: () => "Nueva foto en la timeline",
      body: ({ actorName, roomCode }) =>
        `${actorName} acaba de enviar una foto en la sala ${roomCode}.`,
    },
    fr: {
      title: () => "Nouvelle photo dans la timeline",
      body: ({ actorName, roomCode }) =>
        `${actorName} vient d'ajouter une photo dans la salle ${roomCode}.`,
    },
  },
  "lead-gained": {
    pt: {
      title: () => "Voce assumiu a lideranca",
      body: ({ roomCode }) => `Agora voce esta na frente na sala ${roomCode}.`,
    },
    en: {
      title: () => "You took the lead",
      body: ({ roomCode }) => `You are now leading room ${roomCode}.`,
    },
    es: {
      title: () => "Tomaste la delantera",
      body: ({ roomCode }) => `Ahora lideras la sala ${roomCode}.`,
    },
    fr: {
      title: () => "Vous avez pris la tete",
      body: ({ roomCode }) => `Vous etes maintenant en tete dans la salle ${roomCode}.`,
    },
  },
  "lead-lost": {
    pt: {
      title: () => "Voce perdeu a lideranca",
      body: ({ roomCode }) => `Outro jogador passou voce na sala ${roomCode}.`,
    },
    en: {
      title: () => "You lost the lead",
      body: ({ roomCode }) => `Another player passed you in room ${roomCode}.`,
    },
    es: {
      title: () => "Perdiste la delantera",
      body: ({ roomCode }) => `Otro jugador te supero en la sala ${roomCode}.`,
    },
    fr: {
      title: () => "Vous avez perdu la tete",
      body: ({ roomCode }) => `Un autre joueur vous a depasse dans la salle ${roomCode}.`,
    },
  },
};

async function fetchSubscriptionsForLogins(loginCodes: string[]) {
  if (loginCodes.length === 0) return [];
  const supabase = createAdminClient();
  const normalizedCodes = Array.from(new Set(loginCodes.map((code) => code.trim().toUpperCase())));
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, login_code, endpoint, p256dh, auth, language")
    .eq("enabled", true)
    .in("login_code", normalizedCodes);

  if (error || !data) return [];
  return data as PushSubscriptionRecord[];
}

function buildMessage(
  subscription: PushSubscriptionRecord,
  payload: NotificationPayload,
): PushMessage {
  const lang = normalizeInviteLanguage(subscription.language) as SupportedLanguage;
  const localized = copy[payload.type][lang];
  return {
    title: localized.title(payload),
    body: localized.body(payload),
    url: buildRoomInvitePath(payload.roomCode, lang),
    tag: `${payload.type}-${payload.roomCode}`,
  };
}

export async function notifyLogins(
  loginCodes: string[],
  payload: NotificationPayload,
) {
  const subscriptions = await fetchSubscriptionsForLogins(loginCodes);
  return sendPushToSubscriptions(subscriptions, (subscription) =>
    buildMessage(subscription, payload),
  );
}

import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

const fallbackKeys =
  process.env.NODE_ENV === "production" ? null : webpush.generateVAPIDKeys();

const vapidPublicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? fallbackKeys?.publicKey ?? "";
const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY ?? fallbackKeys?.privateKey ?? "";
const vapidSubject =
  process.env.VAPID_SUBJECT ??
  (process.env.NODE_ENV === "production"
    ? ""
    : "mailto:dev@rodiziorace.local");

let isConfigured = false;

export type PushSubscriptionRecord = {
  id: string;
  login_code: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  language: string | null;
};

export type PushMessage = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};

export function getPushConfig() {
  const available = Boolean(vapidPublicKey && vapidPrivateKey && vapidSubject);
  return {
    available,
    publicKey: available ? vapidPublicKey : "",
  };
}

function ensureWebPushConfigured() {
  const { available } = getPushConfig();
  if (!available) return false;
  if (!isConfigured) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    isConfigured = true;
  }
  return true;
}

export async function sendPushToSubscriptions(
  subscriptions: PushSubscriptionRecord[],
  buildMessage: (subscription: PushSubscriptionRecord) => PushMessage | null,
) {
  if (!ensureWebPushConfigured() || subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const invalidIds: string[] = [];
  const successfulIds: string[] = [];

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const message = buildMessage(subscription);
      if (!message) return;

      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({
            title: message.title,
            body: message.body,
            url: message.url,
            tag: message.tag,
            icon: "/icon-light-32x32.png",
            badge: "/icon-light-32x32.png",
          }),
        );
        successfulIds.push(subscription.id);
      } catch (error) {
        const statusCode =
          typeof error === "object" && error && "statusCode" in error
            ? Number((error as { statusCode?: number }).statusCode)
            : null;
        if (statusCode === 404 || statusCode === 410) {
          invalidIds.push(subscription.id);
        }
      }
    }),
  );

  if (invalidIds.length > 0 || successfulIds.length > 0) {
    const supabase = createAdminClient();
    if (invalidIds.length > 0) {
      await supabase.from("push_subscriptions").delete().in("id", invalidIds);
    }
    if (successfulIds.length > 0) {
      await supabase
        .from("push_subscriptions")
        .update({ last_notified_at: new Date().toISOString() })
        .in("id", successfulIds);
    }
  }

  return {
    sent: successfulIds.length,
    failed: invalidIds.length,
  };
}

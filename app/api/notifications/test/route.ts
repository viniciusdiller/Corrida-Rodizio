import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToSubscriptions } from "@/lib/push/web-push";
import { normalizeInviteLanguage } from "@/lib/utils/room-invite";

type TestPayload = {
  loginCode?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as TestPayload;
    const loginCode = String(body.loginCode ?? "").trim().toUpperCase();

    if (!loginCode) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("id, login_code, endpoint, p256dh, auth, language")
      .eq("enabled", true)
      .eq("login_code", loginCode);

    if (error) {
      console.error("[notifications:test:fetch]", error);
      return NextResponse.json({ ok: false, error: "subscriptions_unavailable" }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ ok: false, error: "no_subscriptions" }, { status: 404 });
    }

    const result = await sendPushToSubscriptions(data, (subscription) => {
      const lang = normalizeInviteLanguage(subscription.language);
      const title =
        lang === "en"
          ? "Test notification"
          : lang === "es"
            ? "Notificacion de prueba"
            : lang === "fr"
              ? "Notification de test"
              : "Notificacao de teste";
      const bodyText =
        lang === "en"
          ? "Push is working on this device."
          : lang === "es"
            ? "Las notificaciones estan funcionando en este dispositivo."
            : lang === "fr"
              ? "Les notifications fonctionnent sur cet appareil."
              : "As notificacoes estao funcionando neste aparelho.";

      return {
        title,
        body: bodyText,
        url: "/",
        tag: "rodizio-test",
      };
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[notifications:test]", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

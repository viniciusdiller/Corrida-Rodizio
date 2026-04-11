import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPushConfig } from "@/lib/push/web-push";
import { normalizeInviteLanguage } from "@/lib/utils/room-invite";

type SerializedPushSubscription = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

type SubscribePayload = {
  loginCode?: string;
  language?: string | null;
  subscription?: SerializedPushSubscription;
};

type UnsubscribePayload = {
  endpoint?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { available } = getPushConfig();
  if (!available) {
    return NextResponse.json({ ok: false, error: "push_unavailable" }, { status: 503 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as SubscribePayload;
    const loginCode = String(body.loginCode ?? "").trim().toUpperCase();
    const endpoint = String(body.subscription?.endpoint ?? "").trim();
    const p256dh = String(body.subscription?.keys?.p256dh ?? "").trim();
    const auth = String(body.subscription?.keys?.auth ?? "").trim();

    if (!loginCode || !endpoint || !p256dh || !auth) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error: upsertError } = await supabase.from("push_subscriptions").upsert(
      {
        login_code: loginCode,
        endpoint,
        p256dh,
        auth,
        language: normalizeInviteLanguage(body.language),
        user_agent: request.headers.get("user-agent"),
        enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );

    if (upsertError) {
      return NextResponse.json({ ok: false, error: "upsert_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as UnsubscribePayload;
    const endpoint = String(body.endpoint ?? "").trim();

    if (!endpoint) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const supabase = createAdminClient();
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

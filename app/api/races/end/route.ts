import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyLogins } from "@/lib/push/account-notifications";

type EndPayload = {
  roomCode?: string;
  requesterId?: string;
};

export const runtime = "nodejs";

async function tryNotify(
  action: string,
  runner: () => Promise<unknown>,
) {
  try {
    await runner();
  } catch (error) {
    console.error(`[notifications:${action}]`, error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as EndPayload;
    const roomCode = String(body.roomCode ?? "").trim().toUpperCase();
    const requesterId = String(body.requesterId ?? "").trim();

    if (!roomCode || !requesterId) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: race, error: raceError } = await supabase
      .from("races")
      .select("id, room_code, is_active")
      .eq("room_code", roomCode)
      .maybeSingle();

    if (raceError || !race?.id) {
      return NextResponse.json({ error: "race_not_found" }, { status: 404 });
    }

    const { data: requester } = await supabase
      .from("participants")
      .select("id, is_vip, race_id")
      .eq("id", requesterId)
      .maybeSingle();

    if (!requester || requester.race_id !== race.id || !requester.is_vip) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (!race.is_active) {
      return NextResponse.json({ ok: true });
    }

    const { error: updateError } = await supabase
      .from("races")
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq("id", race.id);

    if (updateError) {
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    const { data: participants } = await supabase
      .from("participants")
      .select("login_code")
      .eq("race_id", race.id);

    const loginCodes =
      participants
        ?.map((participant) => participant.login_code)
        .filter((value): value is string => !!value) ?? [];

    await tryNotify("race-ended", () =>
      notifyLogins(loginCodes, {
        type: "race-ended",
        roomCode: race.room_code,
      }),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyLogins } from "@/lib/push/account-notifications";

type ReopenPayload = {
  roomCode?: string;
  requesterId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as ReopenPayload;
    const roomCode = String(body.roomCode ?? "").trim().toUpperCase();
    const requesterId = String(body.requesterId ?? "").trim();

    if (!roomCode || !requesterId) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: race, error: raceError } = await supabase
      .from("races")
      .select("id, is_active")
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

    if (race.is_active) {
      return NextResponse.json({ ok: true });
    }

    const { error: updateError } = await supabase
      .from("races")
      .update({ is_active: true, ended_at: null })
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

    try {
      await notifyLogins(loginCodes, {
        type: "race-reopened",
        roomCode,
      });
    } catch (error) {
      console.error("[notifications:race-reopened]", error);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

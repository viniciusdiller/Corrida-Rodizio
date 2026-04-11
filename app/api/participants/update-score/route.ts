import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyLogins } from "@/lib/push/account-notifications";

type UpdateScorePayload = {
  roomCode?: string;
  participantId?: string;
  change?: number;
};

function getLeaderIds(
  rows: Array<{ id: string; items_eaten: number | null }>,
  override?: { id: string; items_eaten: number },
) {
  const normalized = rows.map((row) =>
    override && row.id === override.id
      ? { ...row, items_eaten: override.items_eaten }
      : { ...row, items_eaten: row.items_eaten ?? 0 },
  );
  const maxScore = Math.max(...normalized.map((row) => row.items_eaten ?? 0), 0);
  if (maxScore <= 0) return [] as string[];
  return normalized
    .filter((row) => (row.items_eaten ?? 0) === maxScore)
    .map((row) => row.id);
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as UpdateScorePayload;
    const roomCode = String(body.roomCode ?? "").trim().toUpperCase();
    const participantId = String(body.participantId ?? "").trim();
    const change = Number(body.change ?? 0);

    if (!roomCode || !participantId || !Number.isFinite(change) || change === 0) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: race, error: raceError } = await supabase
      .from("races")
      .select("id, room_code, is_active")
      .eq("room_code", roomCode)
      .maybeSingle();

    if (raceError || !race?.id || !race.is_active) {
      return NextResponse.json({ ok: false, error: "race_not_found" }, { status: 404 });
    }

    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, race_id, items_eaten")
      .eq("id", participantId)
      .maybeSingle();

    if (participantError || !participant || participant.race_id !== race.id) {
      return NextResponse.json({ ok: false, error: "participant_not_found" }, { status: 404 });
    }

    const { data: standings, error: standingsError } = await supabase
      .from("participants")
      .select("id, items_eaten, login_code")
      .eq("race_id", race.id);

    if (standingsError || !standings) {
      return NextResponse.json({ ok: false, error: "standings_unavailable" }, { status: 500 });
    }

    const previousLeaderIds = getLeaderIds(standings);
    const nextCount = Math.max(0, (participant.items_eaten ?? 0) + change);

    const { error: updateError } = await supabase
      .from("participants")
      .update({ items_eaten: nextCount })
      .eq("id", participantId)
      .eq("race_id", race.id);

    if (updateError) {
      return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
    }

    const nextLeaderIds = getLeaderIds(standings, {
      id: participantId,
      items_eaten: nextCount,
    });

    const gainedLeaderIds = nextLeaderIds.filter((id) => !previousLeaderIds.includes(id));
    const lostLeaderIds = previousLeaderIds.filter((id) => !nextLeaderIds.includes(id));

    const gainedLeaderLogins = standings
      .filter((row) => gainedLeaderIds.includes(row.id))
      .map((row) => row.login_code)
      .filter((value): value is string => !!value);

    const lostLeaderLogins = standings
      .filter((row) => lostLeaderIds.includes(row.id))
      .map((row) => row.login_code)
      .filter((value): value is string => !!value);

    await Promise.all([
      notifyLogins(gainedLeaderLogins, {
        type: "lead-gained",
        roomCode: race.room_code,
      }),
      notifyLogins(lostLeaderLogins, {
        type: "lead-lost",
        roomCode: race.room_code,
      }),
    ]);

    return NextResponse.json({ ok: true, itemsEaten: nextCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

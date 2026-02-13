import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Removes a participant from a race when requested by a VIP in the same room.
 *
 * Invariants:
 * - requester and target must belong to the room race,
 * - only VIP requester can remove,
 * - race photo storage is cleaned before participant deletion.
 */

type RemovePayload = {
  roomCode?: string;
  requesterId?: string;
  targetId?: string;
};

const normalizeRemovePayload = (body: RemovePayload) => ({
  roomCode: String(body.roomCode ?? "").trim().toUpperCase(),
  requesterId: String(body.requesterId ?? "").trim(),
  targetId: String(body.targetId ?? "").trim(),
});

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RemovePayload;
    const { roomCode, requesterId, targetId } = normalizeRemovePayload(body);

    if (!roomCode || !requesterId || !targetId) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: race, error: raceError } = await supabase
      .from("races")
      .select("id")
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

    const { data: target } = await supabase
      .from("participants")
      .select("id, race_id")
      .eq("id", targetId)
      .maybeSingle();

    if (!target || target.race_id !== race.id) {
      return NextResponse.json({ error: "target_not_found" }, { status: 404 });
    }

    const { data: photos } = await supabase
      .from("race_photos")
      .select("image_path")
      .eq("race_id", race.id)
      .eq("participant_id", targetId);

    if (photos && photos.length > 0) {
      const paths = photos
        .map((photo) => photo.image_path)
        .filter((value): value is string => !!value);
      if (paths.length > 0) {
        await supabase.storage.from("race-photos").remove(paths);
      }
    }

    await supabase
      .from("race_photos")
      .delete()
      .eq("race_id", race.id)
      .eq("participant_id", targetId);

    const { error: deleteError } = await supabase
      .from("participants")
      .delete()
      .eq("id", targetId)
      .eq("race_id", race.id);

    if (deleteError) {
      return NextResponse.json({ error: "delete_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

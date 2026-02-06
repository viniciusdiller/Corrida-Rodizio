import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomCode = searchParams.get("roomCode")?.trim().toUpperCase() ?? "";
  const participantId = searchParams.get("participantId")?.trim() ?? "";

  if (!roomCode || !participantId) {
    return NextResponse.json({ photos: [] }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    const { data: race, error: raceError } = await supabase
      .from("races")
      .select("id, photo_mode")
      .eq("room_code", roomCode)
      .maybeSingle();

    if (raceError || !race?.id || !race.photo_mode) {
      return NextResponse.json({ photos: [] }, { status: 403 });
    }

    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, race_id")
      .eq("id", participantId)
      .maybeSingle();

    if (
      participantError ||
      !participant?.id ||
      participant.race_id !== race.id
    ) {
      return NextResponse.json({ photos: [] }, { status: 403 });
    }

    const { data: rows, error: photosError } = await supabase
      .from("race_photos")
      .select("id, item_number, image_path, created_at, participants(name)")
      .eq("race_id", race.id)
      .order("created_at", { ascending: true });

    if (photosError) {
      return NextResponse.json({ photos: [] }, { status: 500 });
    }

    const photos = await Promise.all(
      (rows ?? []).map(async (row: any) => {
        const { data } = await supabase.storage
          .from("race-photos")
          .createSignedUrl(row.image_path, 60);
        return {
          id: row.id,
          createdAt: row.created_at,
          itemNumber: row.item_number,
          participantName: row.participants?.name ?? "",
          signedUrl: data?.signedUrl ?? null,
        };
      })
    );

    return NextResponse.json({ photos });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ photos: [] }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomCodesParam = searchParams.get("roomCodes") ?? "";
  const loginCode = searchParams.get("loginCode")?.trim().toUpperCase() ?? "";

  const roomCodes = roomCodesParam
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);

  if (!loginCode || roomCodes.length === 0) {
    return NextResponse.json({ rooms: [] }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    const { data: races } = await supabase
      .from("races")
      .select("id, room_code, photo_mode")
      .in("room_code", roomCodes);

    const photoRaces = (races ?? []).filter((race) => race.photo_mode);
    if (photoRaces.length === 0) {
      return NextResponse.json({ rooms: [] });
    }

    const raceIds = photoRaces.map((race) => race.id);
    const { data: participants } = await supabase
      .from("participants")
      .select("race_id")
      .eq("login_code", loginCode)
      .in("race_id", raceIds);

    const allowedRaceIds = new Set(
      (participants ?? []).map((row) => row.race_id)
    );
    const allowedRaces = photoRaces.filter((race) =>
      allowedRaceIds.has(race.id)
    );
    if (allowedRaces.length === 0) {
      return NextResponse.json({ rooms: [] });
    }

    const allowedIds = allowedRaces.map((race) => race.id);
    const { data: photos } = await supabase
      .from("race_photos")
      .select("race_id")
      .in("race_id", allowedIds)
      .gt("expires_at", new Date().toISOString());

    const racesWithPhotos = new Set(
      (photos ?? []).map((row) => row.race_id)
    );
    const roomCodesWithPhotos = allowedRaces
      .filter((race) => racesWithPhotos.has(race.id))
      .map((race) => race.room_code);

    return NextResponse.json({ rooms: roomCodesWithPhotos });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ rooms: [] }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyLogins } from "@/lib/push/account-notifications";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const roomCode = String(formData.get("roomCode") ?? "").trim().toUpperCase();
    const participantId = String(formData.get("participantId") ?? "").trim();
    const itemNumber = Number(formData.get("itemNumber"));
    const loginCode = String(formData.get("loginCode") ?? "")
      .trim()
      .toUpperCase();
    const file = formData.get("file");

    if (!roomCode || !participantId || !loginCode || !file) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (!Number.isFinite(itemNumber) || itemNumber <= 0) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: race, error: raceError } = await supabase
      .from("races")
      .select("id, photo_mode")
      .eq("room_code", roomCode)
      .maybeSingle();

    if (raceError || !race?.id || !race.photo_mode) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select("id, race_id, login_code, name")
      .eq("id", participantId)
      .maybeSingle();

    if (
      participantError ||
      !participant?.id ||
      participant.race_id !== race.id ||
      !participant.login_code ||
      participant.login_code.trim().toUpperCase() !== loginCode
    ) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const imagePath = `${race.id}/${participantId}/${Date.now()}-${itemNumber}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("race-photos")
      .upload(imagePath, file, { contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    const { error: insertError } = await supabase.from("race_photos").insert({
      race_id: race.id,
      participant_id: participantId,
      item_number: Math.floor(itemNumber),
      image_path: imagePath,
    });

    if (insertError) {
      await supabase.storage.from("race-photos").remove([imagePath]);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    const { data: participants } = await supabase
      .from("participants")
      .select("login_code")
      .eq("race_id", race.id);

    const loginCodes =
      participants
        ?.map((row) => row.login_code)
        .filter((value): value is string => !!value) ?? [];

    await notifyLogins(loginCodes, {
      type: "photo-added",
      roomCode,
      actorName: participant.name ?? loginCode,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_COOKIE = "rodizio_admin";

const getAdminToken = () => {
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) return "";
  const configuredToken = process.env.ADMIN_SESSION_TOKEN ?? "";
  if (configuredToken) return configuredToken;
  return createHash("sha256").update(password).digest("hex");
};

const isAdminAuthenticated = (request: Request) => {
  const expectedToken = getAdminToken();
  if (!expectedToken) {
    return false;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieValue =
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${ADMIN_COOKIE}=`))
      ?.split("=")[1] ?? "";

  const tokenBuffer = Buffer.from(cookieValue, "utf8");
  const expectedBuffer = Buffer.from(expectedToken, "utf8");

  return (
    tokenBuffer.length === expectedBuffer.length &&
    timingSafeEqual(tokenBuffer, expectedBuffer)
  );
};

export async function GET(request: Request) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = (searchParams.get("username") ?? "").trim().toUpperCase();

  try {
    const supabase = createAdminClient();

    if (!username) {
      const [
        racesCountResult,
        activeRacesCountResult,
        playersWithoutAccountCountResult,
        accountCountResult,
        participantsResult,
        photosCountResult,
      ] = await Promise.all([
        supabase.from("races").select("id", { count: "exact", head: true }),
        supabase
          .from("races")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("participants")
          .select("id", { count: "exact", head: true })
          .is("login_code", null),
        supabase.from("logins").select("id", { count: "exact", head: true }),
        supabase.from("participants").select("items_eaten,updated_at"),
        supabase.from("race_photos").select("id", { count: "exact", head: true }),
      ]);

      const participants = Array.isArray(participantsResult.data)
        ? participantsResult.data
        : [];
      const totalItemsCount = participants.reduce(
        (total, participant) =>
          total + Math.max(0, Number(participant.items_eaten ?? 0)),
        0,
      );

      const lastActivityAt = participants.reduce<string | null>((latest, participant) => {
        if (!participant.updated_at) {
          return latest;
        }
        if (!latest) {
          return participant.updated_at;
        }
        return new Date(participant.updated_at) > new Date(latest)
          ? participant.updated_at
          : latest;
      }, null);

      return NextResponse.json({
        raceCount: racesCountResult.count ?? 0,
        activeRacesCount: activeRacesCountResult.count ?? 0,
        playersWithoutAccountCount: playersWithoutAccountCountResult.count ?? 0,
        accountCount: accountCountResult.count ?? 0,
        totalItemsCount,
        photoCount: photosCountResult.count ?? 0,
        lastActivityAt,
      });
    }

    const [participantResult, accountResult] = await Promise.all([
      supabase
        .from("participants")
        .select("id,race_id,items_eaten,updated_at")
        .eq("login_code", username),
      supabase
        .from("logins")
        .select("id", { count: "exact", head: true })
        .eq("username", username),
    ]);

    const participantRows = Array.isArray(participantResult.data)
      ? participantResult.data
      : [];
    const raceIds = Array.from(
      new Set(participantRows.map((participant) => participant.race_id)),
    );
    const participantIds = participantRows.map((participant) => participant.id);

    const totalItemsCount = participantRows.reduce(
      (total, participant) =>
        total + Math.max(0, Number(participant.items_eaten ?? 0)),
      0,
    );
    const lastActivityAt = participantRows.reduce<string | null>((latest, participant) => {
      if (!participant.updated_at) {
        return latest;
      }
      if (!latest) {
        return participant.updated_at;
      }
      return new Date(participant.updated_at) > new Date(latest)
        ? participant.updated_at
        : latest;
    }, null);

    let photoCount = 0;
    if (participantIds.length > 0) {
      const { count } = await supabase
        .from("race_photos")
        .select("id", { count: "exact", head: true })
        .in("participant_id", participantIds);
      photoCount = count ?? 0;
    }

    let activeRacesCount = 0;
    if (raceIds.length > 0) {
      const { count } = await supabase
        .from("races")
        .select("id", { count: "exact", head: true })
        .in("id", raceIds)
        .eq("is_active", true);
      activeRacesCount = count ?? 0;
    }

    return NextResponse.json({
      raceCount: raceIds.length,
      activeRacesCount,
      playersWithoutAccountCount: 0,
      accountCount: accountResult.count ?? 0,
      totalItemsCount,
      photoCount,
      lastActivityAt,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}

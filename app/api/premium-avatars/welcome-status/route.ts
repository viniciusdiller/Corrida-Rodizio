import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPremiumAvatar } from "@/lib/utils/avatars";

const normalizeLoginCode = (value: string | null) =>
  value?.trim().toUpperCase() ?? "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const loginCode = normalizeLoginCode(searchParams.get("loginCode"));

  if (!loginCode) {
    return NextResponse.json({
      shouldPrompt: false,
      claimedCount: 0,
      unlockedAvatars: [],
      availableAvatars: [],
    });
  }

  try {
    const supabase = createAdminClient();

    const [{ data: unlockRows }, avatarsResponse] = await Promise.all([
      supabase
        .from("premium_avatar_unlocks")
        .select("avatar")
        .eq("login_code", loginCode),
      fetch(new URL("/api/avatars", request.url), { cache: "no-store" }),
    ]);

    const avatarsPayload = await avatarsResponse.json().catch(() => ({}));
    const premiumAvatars = Array.isArray(avatarsPayload?.avatars)
      ? (avatarsPayload.avatars as string[]).filter((avatar: string) => isPremiumAvatar(avatar))
      : [];

    const unlockedAvatars = Array.isArray(unlockRows)
      ? unlockRows.map((row) => row.avatar)
      : [];

    const availableAvatars = premiumAvatars.filter(
      (avatar: string) => !unlockedAvatars.includes(avatar),
    );

    return NextResponse.json({
      shouldPrompt: unlockedAvatars.length === 0 && availableAvatars.length > 0,
      claimedCount: unlockedAvatars.length,
      unlockedAvatars,
      availableAvatars,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        shouldPrompt: false,
        claimedCount: 0,
        unlockedAvatars: [],
        availableAvatars: [],
      },
      { status: 500 },
    );
  }
}

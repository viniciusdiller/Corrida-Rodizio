import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPremiumAvatar } from "@/lib/utils/avatars";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
]);

const normalizeLoginCode = (value: string | null) =>
  value?.trim().toUpperCase() ?? "";

const isMissingColumnError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string };
  return maybeError.code === "42703";
};

const loadPremiumAvatars = async () => {
  try {
    const avatarsDir = path.join(process.cwd(), "public", "avatars");
    const entries = await fs.readdir(avatarsDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => ALLOWED_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .filter((avatar) => isPremiumAvatar(avatar));
  } catch {
    return [] as string[];
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const loginCode = normalizeLoginCode(searchParams.get("loginCode"));

  if (!loginCode) {
    return NextResponse.json({
      shouldPrompt: false,
      claimedCount: 0,
      claimCredits: 1,
      remainingClaims: 1,
      unlockedAvatars: [],
      availableAvatars: [],
    });
  }

  try {
    const supabase = createAdminClient();

    const [{ data: unlockRows }, profileResponse, premiumAvatars] = await Promise.all([
      supabase
        .from("premium_avatar_unlocks")
        .select("avatar")
        .eq("login_code", loginCode),
      supabase
        .from("player_profiles")
        .select("premium_avatar_claim_credits")
        .eq("login_code", loginCode)
        .maybeSingle(),
      loadPremiumAvatars(),
    ]);

    const unlockedAvatars = Array.isArray(unlockRows)
      ? Array.from(new Set(unlockRows.map((row) => row.avatar)))
      : [];

    if (profileResponse.error && !isMissingColumnError(profileResponse.error)) {
      throw profileResponse.error;
    }

    const rawClaimCredits = Number(profileResponse.data?.premium_avatar_claim_credits);
    const claimCredits = Number.isFinite(rawClaimCredits)
      ? Math.max(0, Math.floor(rawClaimCredits))
      : 1;
    const remainingClaims = Math.max(0, claimCredits - unlockedAvatars.length);

    const availableAvatars = premiumAvatars.filter(
      (avatar: string) => !unlockedAvatars.includes(avatar),
    );

    return NextResponse.json({
      shouldPrompt: remainingClaims > 0 && availableAvatars.length > 0,
      claimedCount: unlockedAvatars.length,
      claimCredits,
      remainingClaims,
      unlockedAvatars,
      availableAvatars,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        shouldPrompt: false,
        claimedCount: 0,
        claimCredits: 1,
        remainingClaims: 1,
        unlockedAvatars: [],
        availableAvatars: [],
      },
      { status: 500 },
    );
  }
}

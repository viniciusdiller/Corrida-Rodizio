import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPremiumAvatar } from "@/lib/utils/avatars";

interface ClaimPayload {
  loginCode?: string;
  avatar?: string;
}

const normalizeLoginCode = (value?: string) => value?.trim().toUpperCase() ?? "";
const normalizeAvatar = (value?: string) => value?.trim() ?? "";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as ClaimPayload;
  const loginCode = normalizeLoginCode(payload.loginCode);
  const avatar = normalizeAvatar(payload.avatar);

  if (!loginCode || !avatar || !isPremiumAvatar(avatar)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    const { data: existingClaims, error: countError } = await supabase
      .from("premium_avatar_unlocks")
      .select("avatar")
      .eq("login_code", loginCode);

    if (countError) {
      throw countError;
    }

    const currentClaims = Array.isArray(existingClaims) ? existingClaims : [];

    if (currentClaims.some((claim) => claim.avatar === avatar)) {
      return NextResponse.json({ status: "already_claimed", avatar });
    }

    if (currentClaims.length > 0) {
      return NextResponse.json(
        { error: "claim_limit_reached" },
        { status: 409 },
      );
    }

    const { error: insertError } = await supabase
      .from("premium_avatar_unlocks")
      .insert({ login_code: loginCode, avatar, claimed_from: "welcome_grid" });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ status: "claimed", avatar });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "claim_failed" }, { status: 500 });
  }
}

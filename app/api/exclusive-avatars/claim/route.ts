import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const hashCode = (code: string) =>
  createHash("sha256").update(code).digest("hex");

export async function POST(request: Request) {
  try {
    const { loginCode, code } = await request
      .json()
      .catch(() => ({ loginCode: "", code: "" }));
    const trimmedLogin = String(loginCode ?? "").trim().toUpperCase();
    const trimmedCode = String(code ?? "").trim().toUpperCase();

    if (!trimmedLogin || !trimmedCode) {
      return NextResponse.json(
        { status: "invalid", avatar: null },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: loginData, error: loginError } = await supabase
      .from("logins")
      .select("username")
      .eq("username", trimmedLogin)
      .maybeSingle();

    if (loginError || !loginData?.username) {
      return NextResponse.json(
        { status: "invalid", avatar: null },
        { status: 400 }
      );
    }

    const codeHash = hashCode(trimmedCode);
    const { data: matchedCodes, error: codeError } = await supabase
      .from("exclusive_avatar_codes")
      .select("id, avatar, uses, max_uses, expires_at, disabled_at")
      .eq("code_hash", codeHash)
      .is("disabled_at", null)
      .limit(1);

    if (codeError || !Array.isArray(matchedCodes) || matchedCodes.length === 0) {
      return NextResponse.json(
        { status: "invalid", avatar: null },
        { status: 400 }
      );
    }

    const matchedCode = matchedCodes[0];
    const avatar = String(matchedCode.avatar ?? "").trim();

    if (!avatar) {
      return NextResponse.json(
        { status: "invalid", avatar: null },
        { status: 400 }
      );
    }

    if (matchedCode.expires_at) {
      const expiresAtMs = new Date(matchedCode.expires_at).getTime();
      if (Number.isFinite(expiresAtMs) && Date.now() > expiresAtMs) {
        return NextResponse.json(
          { status: "invalid", avatar: null },
          { status: 400 }
        );
      }
    }

    const currentUses = Math.max(0, Number(matchedCode.uses) || 0);
    const maxUses = Math.max(1, Number(matchedCode.max_uses) || 1);

    if (currentUses >= maxUses) {
      return NextResponse.json(
        { status: "invalid", avatar: null },
        { status: 400 }
      );
    }

    const { data: existingUnlock, error: unlockError } = await supabase
      .from("exclusive_avatars")
      .select("avatar")
      .eq("login_code", trimmedLogin)
      .eq("avatar", avatar)
      .maybeSingle();

    if (unlockError) {
      return NextResponse.json(
        { status: "failed", avatar: null },
        { status: 500 }
      );
    }

    if (existingUnlock?.avatar) {
      return NextResponse.json({ status: "already_claimed", avatar });
    }

    const { error: unlockInsertError } = await supabase
      .from("exclusive_avatars")
      .upsert({ login_code: trimmedLogin, avatar }, { onConflict: "login_code,avatar" });

    if (unlockInsertError) {
      return NextResponse.json(
        { status: "failed", avatar: null },
        { status: 500 }
      );
    }

    const { error: usageUpdateError } = await supabase
      .from("exclusive_avatar_codes")
      .update({ uses: currentUses + 1 })
      .eq("id", matchedCode.id);

    if (usageUpdateError) {
      return NextResponse.json(
        { status: "failed", avatar: null },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "claimed", avatar });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: "failed", avatar: null }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const CODE_LENGTH = 6;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

const generateCode = () => {
  const bytes = randomBytes(CODE_LENGTH);
  let result = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    result += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return result;
};

const hashCode = (code: string) =>
  createHash("sha256").update(code).digest("hex");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const loginCode = searchParams.get("loginCode")?.trim().toUpperCase() ?? "";
  if (!loginCode) {
    return NextResponse.json({ codes: [] });
  }

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("exclusive_avatar_codes")
      .select(
        "id, avatar, max_uses, uses, expires_at, created_at, created_by_login_code"
      )
      .eq("created_by_login_code", loginCode)
      .is("disabled_at", null)
      .order("created_at", { ascending: false });

    return NextResponse.json({ codes: Array.isArray(data) ? data : [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ codes: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const loginCode = String(body?.loginCode ?? "").trim().toUpperCase();
    const avatar = String(body?.avatar ?? "").trim();
    const expiresInDays = Number(body?.expiresInDays ?? 7);
    const maxUsesInput = Number(body?.maxUses ?? 1);

    if (!loginCode || !avatar) {
      return NextResponse.json(
        { status: "invalid", code: null },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: loginData } = await supabase
      .from("logins")
      .select("username")
      .eq("username", loginCode)
      .maybeSingle();

    if (!loginData?.username) {
      return NextResponse.json(
        { status: "unknown_user", code: null },
        { status: 400 }
      );
    }

    const { data: permission } = await supabase
      .from("exclusive_avatar_permissions")
      .select("avatar")
      .eq("login_code", loginCode)
      .eq("avatar", avatar)
      .maybeSingle();

    if (!permission?.avatar) {
      return NextResponse.json(
        { status: "forbidden", code: null },
        { status: 403 }
      );
    }

    const maxUses = Number.isFinite(maxUsesInput) && maxUsesInput > 0
      ? Math.floor(maxUsesInput)
      : 1;
    const expiresAt =
      Number.isFinite(expiresInDays) && expiresInDays > 0
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    let created = null;
    let plainCode = "";

    for (let attempt = 0; attempt < 5; attempt += 1) {
      plainCode = generateCode();
      const codeHash = hashCode(plainCode);
      const { data, error } = await supabase
        .from("exclusive_avatar_codes")
        .insert({
          avatar,
          code_hash: codeHash,
          code_plain: plainCode,
          max_uses: maxUses,
          uses: 0,
          expires_at: expiresAt,
          created_by_login_code: loginCode,
        })
        .select("id, avatar, max_uses, uses, expires_at, created_at")
        .single();

      if (!error && data) {
        created = data;
        break;
      }
    }

    if (!created) {
      return NextResponse.json(
        { status: "failed", code: null },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "created",
      code: plainCode,
      avatar: created.avatar,
      id: created.id,
      expires_at: created.expires_at,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { status: "failed", code: null },
      { status: 500 }
    );
  }
}

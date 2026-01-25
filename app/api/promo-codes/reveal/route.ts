import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const loginCode = String(body?.loginCode ?? "").trim().toUpperCase();
    const codeId = String(body?.codeId ?? "").trim();

    if (!loginCode || !codeId) {
      return NextResponse.json({ status: "invalid", code: null }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("exclusive_avatar_codes")
      .select("code_plain, created_by_login_code")
      .eq("id", codeId)
      .maybeSingle();

    if (error || !data || data.created_by_login_code !== loginCode) {
      return NextResponse.json({ status: "forbidden", code: null }, { status: 403 });
    }

    return NextResponse.json({ status: "ok", code: data.code_plain ?? null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: "failed", code: null }, { status: 500 });
  }
}

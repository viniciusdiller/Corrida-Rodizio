import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const loginCode = String(body?.loginCode ?? "").trim().toUpperCase();
    const codeId = String(body?.codeId ?? "").trim();

    if (!loginCode || !codeId) {
      return NextResponse.json(
        { status: "invalid" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data } = await supabase
      .from("exclusive_avatar_codes")
      .select("id, created_by_login_code")
      .eq("id", codeId)
      .maybeSingle();

    if (!data || data.created_by_login_code !== loginCode) {
      return NextResponse.json(
        { status: "forbidden" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("exclusive_avatar_codes")
      .update({
        disabled_at: new Date().toISOString(),
        expires_at: new Date().toISOString(),
      })
      .eq("id", codeId);

    if (error) {
      return NextResponse.json(
        { status: "failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "disabled" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: "failed" }, { status: 500 });
  }
}

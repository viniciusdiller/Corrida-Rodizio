import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = String(body?.username || "").trim().toUpperCase();
    const code = String(body?.code || "").trim().toUpperCase();
    const newPassword = String(body?.newPassword || "");

    if (!username || !code || newPassword.length < 6) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("finish_login_password_reset", {
      p_username: username,
      p_code: code,
      p_new_password: newPassword,
    });

    if (error || !data) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

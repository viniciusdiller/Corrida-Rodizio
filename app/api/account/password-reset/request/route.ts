import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordResetCodeEmail } from "@/lib/email/password-reset";

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = String(body?.username || "").trim().toUpperCase();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!username || !email) {
      return NextResponse.json({ success: false, reason: "missing_fields" }, { status: 400 });
    }

    const code = generateCode();
    const supabase = createAdminClient();
    const { data } = await supabase.rpc("start_login_password_reset", {
      p_username: username,
      p_email: email,
      p_code: code,
    });

    if (!data) {
      return NextResponse.json({ success: false, reason: "username_email_mismatch" }, { status: 400 });
    }

    await sendPasswordResetCodeEmail({ to: email, code, username });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, reason: "unexpected_error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const loginCode = (searchParams.get("loginCode") || "").trim().toUpperCase();
    if (!loginCode) {
      return NextResponse.json({ email: null }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("get_login_recovery_email", {
      p_username: loginCode,
    });

    if (error) {
      return NextResponse.json({ email: null }, { status: 500 });
    }

    return NextResponse.json({ email: data ?? null });
  } catch {
    return NextResponse.json({ email: null }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const loginCode = String(body?.loginCode || "").trim().toUpperCase();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!loginCode || !email) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("set_login_recovery_email", {
      p_username: loginCode,
      p_email: email,
    });

    if (error || !data) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

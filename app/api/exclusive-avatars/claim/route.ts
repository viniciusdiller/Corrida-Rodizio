import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const { data, error } = await supabase.rpc("claim_exclusive_avatar", {
      p_login_code: trimmedLogin,
      p_code: trimmedCode,
    });

    if (error || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { status: "invalid", avatar: null },
        { status: 400 }
      );
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: "invalid", avatar: null }, { status: 500 });
  }
}

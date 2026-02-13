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

    if (error) {
      return NextResponse.json(
        { status: "invalid", avatar: null },
        { status: 400 }
      );
    }

    const normalizedData = Array.isArray(data) ? data[0] : data;

    if (!normalizedData) {
      return NextResponse.json(
        { status: "invalid", avatar: null },
        { status: 400 }
      );
    }

    if (typeof normalizedData === "string") {
      return NextResponse.json({ status: normalizedData, avatar: null });
    }

    if (typeof normalizedData === "object") {
      const status =
        typeof (normalizedData as { status?: unknown }).status === "string"
          ? (normalizedData as { status: string }).status
          : "claimed";
      const avatar =
        typeof (normalizedData as { avatar?: unknown }).avatar === "string"
          ? (normalizedData as { avatar: string }).avatar
          : null;

      return NextResponse.json({ status, avatar });
    }

    return NextResponse.json({ status: "invalid", avatar: null }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: "invalid", avatar: null }, { status: 500 });
  }
}

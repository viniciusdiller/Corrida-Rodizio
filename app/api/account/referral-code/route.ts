import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getReferralCodeByColumn(loginCode: string, column: "username" | "code") {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("logins")
    .select("referral_code")
    .eq(column, loginCode)
    .maybeSingle();

  if (error) {
    return { referralCode: null as string | null, error };
  }

  const referralCode = typeof data?.referral_code === "string" ? data.referral_code : null;
  return { referralCode, error: null };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const loginCode = (searchParams.get("loginCode") || "").trim().toUpperCase();

    if (!loginCode) {
      return NextResponse.json({ referralCode: null }, { status: 400 });
    }

    const byUsername = await getReferralCodeByColumn(loginCode, "username");
    if (!byUsername.error) {
      return NextResponse.json({ referralCode: byUsername.referralCode });
    }

    const byCode = await getReferralCodeByColumn(loginCode, "code");
    if (!byCode.error) {
      return NextResponse.json({ referralCode: byCode.referralCode });
    }

    return NextResponse.json({ referralCode: null }, { status: 500 });
  } catch {
    return NextResponse.json({ referralCode: null }, { status: 500 });
  }
}

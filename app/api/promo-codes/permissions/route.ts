import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const loginCode = searchParams.get("loginCode")?.trim().toUpperCase() ?? "";
  if (!loginCode) {
    return NextResponse.json({ avatars: [] });
  }

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("exclusive_avatar_permissions")
      .select("avatar")
      .eq("login_code", loginCode);

    return NextResponse.json({
      avatars: Array.isArray(data) ? data.map((row) => row.avatar) : [],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ avatars: [] });
  }
}

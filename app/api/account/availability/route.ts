import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAlphanumericOnly } from "@/lib/utils/username-validation";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = (searchParams.get("username") || "").trim().toUpperCase();

    if (!username) {
      return NextResponse.json({ available: false, reason: "missing_username" }, { status: 400 });
    }

    if (!isAlphanumericOnly(username)) {
      return NextResponse.json({ available: false, reason: "invalid_username" }, { status: 400 });
    }

    const createLookupClient = () => {
      try {
        return createAdminClient();
      } catch {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
        if (!url || !anonKey) {
          return null;
        }
        return createClient(url, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
      }
    };

    const supabase = createLookupClient();
    if (!supabase) {
      return NextResponse.json(
        { available: false, reason: "missing_credentials" },
        { status: 500 },
      );
    }

    const [profileLookup, loginLookup] = await Promise.all([
      supabase
        .from("player_profiles")
        .select("login_code")
        .eq("login_code", username)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("logins")
        .select("code")
        .eq("code", username)
        .limit(1)
        .maybeSingle(),
    ]);

    const foundInProfiles = !!profileLookup.data && !profileLookup.error;
    const foundInLogins = !!loginLookup.data && !loginLookup.error;

    const available = !foundInProfiles && !foundInLogins;

    return NextResponse.json({ available });
  } catch {
    return NextResponse.json(
      { available: false, reason: "internal_error" },
      { status: 500 },
    );
  }
}

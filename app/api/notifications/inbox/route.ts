import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type MarkReadPayload = {
  ids?: string[];
  loginCode?: string;
  markAll?: boolean;
};

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const loginCode = String(searchParams.get("loginCode") ?? "")
      .trim()
      .toUpperCase();

    if (!loginCode) {
      return NextResponse.json({ notifications: [] }, { status: 200 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("user_notifications")
      .select("id, kind, title, body, href, is_read, created_at")
      .eq("login_code", loginCode)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[notifications:inbox:get]", error);
      return NextResponse.json({ error: "Failed to load inbox" }, { status: 500 });
    }

    return NextResponse.json({ notifications: data ?? [] });
  } catch (error) {
    console.error("[notifications:inbox:get]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as MarkReadPayload;
    const loginCode = String(body.loginCode ?? "").trim().toUpperCase();
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
    const markAll = Boolean(body.markAll);

    if (!loginCode || (!markAll && ids.length === 0)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = createAdminClient();
    let query = supabase
      .from("user_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("login_code", loginCode)
      .eq("is_read", false);

    if (!markAll) {
      query = query.in("id", ids);
    }

    const { error } = await query;
    if (error) {
      console.error("[notifications:inbox:read]", error);
      return NextResponse.json({ error: "Failed to update inbox" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[notifications:inbox:read]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

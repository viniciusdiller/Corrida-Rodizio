import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email/welcome";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = String(body?.username || "").trim().toUpperCase();
    const email = String(body?.email || "").trim().toLowerCase();
    const language = String(body?.language || "").trim().toLowerCase();

    if (!username || !email) {
      return NextResponse.json({ success: false, reason: "missing_fields" }, { status: 400 });
    }

    await sendWelcomeEmail({ to: email, username, language });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, reason: "unexpected_error" }, { status: 500 });
  }
}

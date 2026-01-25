import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

const ADMIN_COOKIE = "rodizio_admin";

const getAdminToken = () => {
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) return "";
  const configuredToken = process.env.ADMIN_SESSION_TOKEN ?? "";
  if (configuredToken) return configuredToken;
  return createHash("sha256").update(password).digest("hex");
};

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({ password: "" }));
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!expectedPassword) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not set" },
      { status: 500 }
    );
  }

  const passwordBuffer = Buffer.from(String(password ?? ""), "utf8");
  const expectedBuffer = Buffer.from(expectedPassword, "utf8");
  const isMatch =
    passwordBuffer.length === expectedBuffer.length &&
    timingSafeEqual(passwordBuffer, expectedBuffer);

  if (!isMatch) {
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  }

  const token = getAdminToken();
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

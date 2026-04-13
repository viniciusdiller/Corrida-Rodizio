import { createHash, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "rodizio_admin";

export function getAdminToken() {
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) return "";
  const configuredToken = process.env.ADMIN_SESSION_TOKEN ?? "";
  if (configuredToken) return configuredToken;
  return createHash("sha256").update(password).digest("hex");
}

export function isAdminAuthenticated(request: Request) {
  const expectedToken = getAdminToken();
  if (!expectedToken) {
    return false;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieValue =
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${ADMIN_COOKIE}=`))
      ?.split("=")[1] ?? "";

  const tokenBuffer = Buffer.from(cookieValue, "utf8");
  const expectedBuffer = Buffer.from(expectedToken, "utf8");

  return (
    tokenBuffer.length === expectedBuffer.length &&
    timingSafeEqual(tokenBuffer, expectedBuffer)
  );
}

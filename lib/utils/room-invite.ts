export function normalizeInviteLanguage(language?: string | null) {
  if (!language) return "pt";
  const normalized = language.toLowerCase();
  if (normalized.startsWith("en")) return "en";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("fr")) return "fr";
  return "pt";
}

export function buildRoomInviteUrl(
  origin: string,
  roomCode: string,
  language?: string | null,
) {
  const url = new URL(`/sala/${roomCode.toUpperCase()}`, origin);
  url.searchParams.set("lang", normalizeInviteLanguage(language));
  return url.toString();
}

export function buildRoomQrPagePath(roomCode: string, language?: string | null) {
  const params = new URLSearchParams({
    lang: normalizeInviteLanguage(language),
  });
  return `/sala/${roomCode.toUpperCase()}/qr?${params.toString()}`;
}

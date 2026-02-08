import type { Metadata } from "next";
import RoomPageClient from "./page-client";

interface SalaPageProps {
  params: { codigo?: string };
  searchParams?: { lang?: string };
}

const INVITE_TITLE_BY_LANG: Record<string, string> = {
  pt: "Voce foi convidado para uma batalha! Sala {room}",
  en: "You were invited to a battle! Room {room}",
  fr: "Vous avez ete invite a une bataille ! Salle {room}",
  es: "Fuiste invitado a una batalla! Sala {room}",
};

export function generateMetadata({
  params,
  searchParams,
}: SalaPageProps): Metadata {
  const rawRoom = params?.codigo ? String(params.codigo) : "";
  const room = rawRoom && rawRoom !== "undefined" && rawRoom !== "null" ? rawRoom : "";
  const lang = searchParams?.lang?.toLowerCase() ?? "pt";
  const template = INVITE_TITLE_BY_LANG[lang] ?? INVITE_TITLE_BY_LANG.pt;
  const title = room
    ? template.replace("{room}", room)
    : template.replace(" Sala {room}", "").replace("{room}", "").trim();
  return {
    title,
    openGraph: {
      title,
    },
    twitter: {
      title,
    },
  };
}

export default function SalaPage() {
  return <RoomPageClient />;
}

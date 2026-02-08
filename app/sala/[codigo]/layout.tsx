import type { Metadata } from "next";

interface SalaLayoutProps {
  children: React.ReactNode;
  params: { codigo: string };
  searchParams?: { lang?: string };
}

const INVITE_TITLE_BY_LANG: Record<string, string> = {
  pt: "Você foi convidado para uma batalha! Sala {room}",
  en: "You were invited to a battle! Room {room}",
  fr: "Vous avez été invité à une bataille ! Salle {room}",
  es: "¡Fuiste invitado a una batalla! Sala {room}",
};

export function generateMetadata({
  params,
  searchParams,
}: SalaLayoutProps): Metadata {
  const lang = searchParams?.lang?.toLowerCase() ?? "pt";
  const template = INVITE_TITLE_BY_LANG[lang] ?? INVITE_TITLE_BY_LANG.pt;
  const title = template.replace("{room}", params.codigo);
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

export default function SalaLayout({ children }: SalaLayoutProps) {
  return children;
}

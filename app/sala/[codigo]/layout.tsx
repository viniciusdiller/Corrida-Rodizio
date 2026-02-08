import type { Metadata } from "next";

interface SalaLayoutProps {
  children: React.ReactNode;
  params: { codigo: string };
}

export function generateMetadata({ params }: SalaLayoutProps): Metadata {
  return {
    title: `Você foi convidado para uma batalha! Sala ${params.codigo}`,
  };
}

export default function SalaLayout({ children }: SalaLayoutProps) {
  return children;
}

import Link from "next/link";
import type { ReactNode } from "react";

export const SITE_URL = "https://rodiziorace.mechama.eu";
export const CONTACT_EMAIL = "contato@mechama.eu";

const navLinks = [
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/guia", label: "Guias" },
  { href: "/faq", label: "Perguntas frequentes" },
  { href: "/quem-somos", label: "Quem somos" },
  { href: "/contato", label: "Contato" },
];

const legalLinks = [
  { href: "/privacy", label: "Política de Privacidade" },
  { href: "/terms", label: "Termos de Uso" },
];

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-orange-100/50 via-background to-background dark:from-purple-950/50 dark:via-black dark:to-black">
      <header className="border-b border-muted/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="text-lg font-black text-foreground">
            Rodízio Race
          </Link>
          <nav
            aria-label="Navegação principal"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/"
              className="rounded-xl bg-foreground px-3 py-1.5 text-background transition hover:opacity-90"
            >
              Abrir o app
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>

      <SiteFooter />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-muted/60 px-6 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 md:flex-row md:justify-between">
        <div className="max-w-sm space-y-2">
          <p className="font-bold text-foreground">Rodízio Race</p>
          <p>
            Contador gratuito para competições de rodízio entre amigos, com
            ranking em tempo real, equipes e modo foto opcional.
          </p>
          <p>
            Contato:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline underline-offset-4 hover:text-foreground"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
        <nav aria-label="Rodapé" className="grid grid-cols-2 gap-x-10 gap-y-2">
          {[...navLinks, ...legalLinks].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mx-auto mt-6 max-w-4xl text-xs">
        © {new Date().getFullYear()} Rodízio Race. Todos os direitos reservados.
      </p>
    </footer>
  );
}

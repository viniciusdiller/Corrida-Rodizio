"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-8 mb-4 space-y-3 text-center text-[10px] text-muted-foreground/60 uppercase font-medium tracking-widest shrink-0">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link href="/terms" className="transition hover:text-foreground/80">
          {t.footer.terms}
        </Link>
        <Link href="/privacy" className="transition hover:text-foreground/80">
          {t.footer.privacy}
        </Link>
        <Link
          href="/quem-somos"
          className="transition hover:text-foreground/80"
        >
          {t.footer.about}
        </Link>
        <a
          href="https://ko-fi.com/rodiziorace"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 transition hover:text-foreground/80"
        >
          <Heart className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
          <span>{t.footer.buy_me_a_coffee}</span>
        </a>
      </nav>
      <p>
        {t.footer.copyright.replace(
          "{{year}}",
          new Date().getFullYear().toString(),
        )}
      </p>
    </footer>
  );
}

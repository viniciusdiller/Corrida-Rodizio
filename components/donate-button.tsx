"use client";

import { Heart } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function DonateButton() {
  const { t } = useLanguage();

  return (
    <a
      href="https://ko-fi.com/rodiziorace"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.common.donate_label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 shadow-sm transition hover:cursor-pointer hover:bg-accent/30"
    >
      <Heart className="h-5 w-5 text-red-500" aria-hidden="true" />
    </a>
  );
}

"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

export function DonateButton() {
  const { t } = useLanguage();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      asChild
      aria-label={t.common.donate_label}
      className="rounded-full border-border bg-background/90 shadow-sm hover:cursor-pointer hover:bg-accent/30"
    >
      <a
        href="https://ko-fi.com/rodiziorace"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.common.donate_label}
      >
        <Heart className="h-5 w-5" />
      </a>
    </Button>
  );
}

// components/language-toggle.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setLanguage(language === "pt" ? "en" : "pt")}
      title={language === "pt" ? "Mudar para Inglês" : "Change to Portuguese"}
      className="w-9 h-9 rounded-xl border border-muted/50 bg-background/80"
    >
      <span className="font-bold text-xs">
        {language === "pt" ? "BR" : "EN"}
      </span>
    </Button>
  );
}

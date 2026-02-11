// components/language-toggle.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/language-context";
import { Check, Globe } from "lucide-react";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const labels = {
    pt: "BR",
    en: "EN",
    es: "ES",
    fr: "FR",
  };

  const options = [
    { code: "pt", flag: "🇧🇷", label: "Português" },
    { code: "en", flag: "🇺🇸", label: "English" },
    { code: "es", flag: "🇪🇸", label: "Español" },
    { code: "fr", flag: "🇫🇷", label: "Français" },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Alterar idioma / Change language"
          className="h-9 gap-2 rounded-xl border-border bg-background/90 px-3 shadow-sm hover:bg-accent/30"
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-bold">
            {labels[language as keyof typeof labels]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40 border-border/90 shadow-lg">
        {options.map((option) => {
          const isSelected = language === option.code;
          return (
            <DropdownMenuItem
              key={option.code}
              onClick={() => setLanguage(option.code)}
              className={`flex items-center justify-between rounded-md ${
                isSelected ? "bg-accent/40 font-semibold" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{option.flag}</span>
                <span>{option.label}</span>
              </span>
              {isSelected ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// lib/i18n/translations.ts

import { pt } from "@/lib/i18n/locales/pt";
import { en } from "@/lib/i18n/locales/en";
import { es } from "@/lib/i18n/locales/es";
import { fr } from "@/lib/i18n/locales/fr";

export type Language = "pt" | "en" | "es" | "fr";

export const translations = {
  pt,
  en,
  es,
  fr,
} as const;

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { translations, type Language } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase/client";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (typeof translations)["pt"];
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Começamos sempre com 'pt' para garantir que o servidor consiga renderizar
  const [language, setLanguage] = useState<Language>("pt");

  const normalizeLanguage = (value?: string | null): Language | null => {
    if (!value) return null;
    const normalized = value.toLowerCase();
    if (normalized.startsWith("pt")) return "pt";
    if (normalized.startsWith("en")) return "en";
    if (normalized.startsWith("es")) return "es";
    if (normalized.startsWith("fr")) return "fr";
    return null;
  };

  const getBrowserLanguage = (): Language | null => {
    if (typeof navigator === "undefined") return null;
    const candidates = [
      ...(navigator.languages ?? []),
      navigator.language,
    ].filter(Boolean) as string[];
    for (const candidate of candidates) {
      const match = normalizeLanguage(candidate);
      if (match) return match;
    }
    return null;
  };

  const loadAccountLanguage = useCallback(async (loginCode: string) => {
    const normalizedLogin = loginCode.trim().toUpperCase();
    if (!normalizedLogin) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("logins")
      .select("preferred_language")
      .eq("username", normalizedLogin)
      .maybeSingle();
    const accountLanguage = normalizeLanguage(data?.preferred_language);
    if (accountLanguage) {
      setLanguage(accountLanguage);
      localStorage.setItem("rodizio-lang", accountLanguage);
      return;
    }

    const savedLanguage = normalizeLanguage(localStorage.getItem("rodizio-lang"));
    if (savedLanguage) {
      void supabase
        .from("logins")
        .update({ preferred_language: savedLanguage })
        .eq("username", normalizedLogin);
    }
  }, []);

  // Assim que carregar no cliente, verificamos se havia uma preferência salva
  useEffect(() => {
    const saved = normalizeLanguage(localStorage.getItem("rodizio-lang"));
    if (saved) {
      setLanguage(saved);
      return;
    }

    const browserLanguage = getBrowserLanguage();
    if (browserLanguage) {
      setLanguage(browserLanguage);
      localStorage.setItem("rodizio-lang", browserLanguage);
    }
  }, []);

  useEffect(() => {
    const storedLogin = localStorage.getItem("rodizio-race-login");
    if (storedLogin) {
      void loadAccountLanguage(storedLogin);
    }

    const handleLoginUpdated = () => {
      const latestLogin = localStorage.getItem("rodizio-race-login");
      if (latestLogin) {
        void loadAccountLanguage(latestLogin);
      }
    };

    window.addEventListener("rodizio-login-updated", handleLoginUpdated);
    return () => {
      window.removeEventListener("rodizio-login-updated", handleLoginUpdated);
    };
  }, [loadAccountLanguage]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("rodizio-lang", lang);
    const storedLogin = localStorage.getItem("rodizio-race-login");
    if (storedLogin) {
      const supabase = createClient();
      void supabase
        .from("logins")
        .update({ preferred_language: lang })
        .eq("username", storedLogin.trim().toUpperCase());
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

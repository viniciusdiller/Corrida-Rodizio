"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, type Language } from "@/lib/i18n/translations";

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

  // Assim que carregar no cliente, verificamos se havia uma preferência salva
  useEffect(() => {
    const saved = localStorage.getItem("rodizio-lang") as Language;
    if (saved && (saved === "pt" || saved === "en")) {
      setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("rodizio-lang", lang);
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

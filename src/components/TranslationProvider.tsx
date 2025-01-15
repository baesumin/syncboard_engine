import { useState, ReactNode, useCallback } from "react";
import { Languages, TranslationContext } from "./TranslationContext";

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Languages>("ko");

  const changeLanguage = useCallback((lang: Languages) => {
    setLanguage(lang);
  }, []);

  return (
    <TranslationContext.Provider value={{ language, changeLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};

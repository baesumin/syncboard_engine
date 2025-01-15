import { useCallback, useContext } from "react";
import en from "../libs/lang/lang.en.json";
import ko from "../libs/lang/lang.ko.json";
import zh from "../libs/lang/lang.zh.json";
import { TranslationContext } from "../components/TranslationContext";

const translations = {
  ko,
  en,
  zh,
} as const;

type TranslationKey = keyof typeof translations.ko;

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }

  const { language, changeLanguage } = context;

  const t = useCallback(
    (key: TranslationKey) => {
      return translations[language][key];
    },
    [language]
  );

  return { t, changeLanguage, language };
};

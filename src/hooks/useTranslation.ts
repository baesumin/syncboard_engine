import { useState, useCallback } from "react";
import en from "../libs/lang/lang.en.json";
import ko from "../libs/lang/lang.ko.json";
import zh from "../libs/lang/lang.zh.json";

// 언어 데이터 타입 정의
type Languages = "ko" | "en" | "zh";

// 번역 데이터
const translations = {
  ko,
  en,
  zh,
} as const;

type TranslationKey = keyof typeof translations.ko;

export const useTranslation = () => {
  const [language, setLanguage] = useState<Languages>("ko");

  const t = useCallback(
    (key: TranslationKey) => {
      return translations[language][key];
    },
    [language]
  );

  const changeLanguage = useCallback((lang: Languages) => {
    setLanguage(lang);
  }, []);

  return { t, changeLanguage, language };
};

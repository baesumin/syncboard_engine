import { createContext } from "react";

export type Languages = "ko" | "en" | "zh";

export interface TranslationContextType {
  language: Languages;
  changeLanguage: (lang: Languages) => void;
}

export const TranslationContext = createContext<TranslationContextType | null>(
  null
);

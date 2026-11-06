import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "../../data/locales.js";
import { translator, type Translator } from "./messages.js";
import { negotiateLocale } from "./negotiate.js";

const CHOICE_KEY = "domiton.language";

function savedChoice(): string | null {
  try {
    return localStorage.getItem(CHOICE_KEY);
  } catch {
    return null; // Storage can be turned off. The device's language still works.
  }
}

function saveChoice(locale: Locale) {
  try {
    localStorage.setItem(CHOICE_KEY, locale);
  } catch {
    // The choice then lasts until the page closes.
  }
}

function startingLocale(): Locale {
  const desktop = window.domiton;
  return negotiateLocale(savedChoice(), desktop?.languages ?? navigator.languages, desktop?.country);
}

interface I18n extends Translator {
  setLocale(locale: Locale): void;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(startingLocale);

  const value = useMemo<I18n>(
    () => ({
      ...translator(locale),
      setLocale(next) {
        saveChoice(next);
        setLocale(next);
      },
    }),
    [locale],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = value.t("meta.title");
    document.querySelector('meta[name="description"]')?.setAttribute("content", value.t("meta.description"));
  }, [locale, value]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const i18n = useContext(I18nContext);
  if (!i18n) throw new Error("useI18n needs an I18nProvider above it");
  return i18n;
}

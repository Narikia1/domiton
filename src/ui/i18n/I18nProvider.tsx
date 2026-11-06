import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "../../data/locales.js";
import { findCountry } from "../client.js";
import { translator, type Translator } from "./messages.js";
import { locationDecides, negotiateLocale } from "./negotiate.js";

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

function deviceLanguages(): readonly string[] {
  return window.domiton?.languages ?? navigator.languages;
}

interface I18n extends Translator {
  setLocale(locale: Locale): void;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => negotiateLocale(savedChoice(), deviceLanguages()));

  // Location only counts when nobody chose and the device has none of the app's languages, so it's only asked for then.
  useEffect(() => {
    let current = true;
    const follow = () => {
      setLocale(negotiateLocale(savedChoice(), deviceLanguages()));
      if (!locationDecides(savedChoice(), deviceLanguages())) return;
      void findCountry().then((country) => {
        // Read the choice again, as the person may have picked a language in the meantime.
        if (current && country) setLocale(negotiateLocale(savedChoice(), deviceLanguages(), country));
      });
    };
    follow();
    window.addEventListener("languagechange", follow);
    return () => {
      current = false;
      window.removeEventListener("languagechange", follow);
    };
  }, []);

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

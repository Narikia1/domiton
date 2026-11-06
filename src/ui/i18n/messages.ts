import { BRAND } from "../../data/brand.js";
import type { Locale } from "../../data/locales.js";
import { de } from "./de.js";
import { en, type MessageKey, type Messages } from "./en.js";
import { fr } from "./fr.js";

export type { MessageKey };

/** Every language must provide every key, which the Messages type enforces. */
export const CATALOGS: Record<Locale, Messages> = { en, de, fr };

const BRAND_WORDS = { app: BRAND.name, company: BRAND.company, family: BRAND.family };

export interface Translator {
  locale: Locale;
  t(key: MessageKey, values?: Record<string, string | number>): string;
  /** A date as people read it in this language, or null if the registry sent something else. */
  date(iso: string): string | null;
}

export function translator(locale: Locale): Translator {
  return {
    locale,
    t(key, values = {}) {
      const all: Record<string, string | number> = { ...BRAND_WORDS, ...values };
      return CATALOGS[locale][key].replace(/\{(\w+)\}/g, (placeholder, name: string) => String(all[name] ?? placeholder));
    },
    date(iso) {
      const parsed = new Date(iso);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
    },
  };
}

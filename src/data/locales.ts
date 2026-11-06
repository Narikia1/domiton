/** The languages the app speaks. English is the source of truth for every message. */
export const LOCALES = ["en", "de", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Each language's name in itself, because that's how people look for their own. */
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", de: "Deutsch", fr: "Français" };

export function isLocale(value: unknown): value is Locale {
  return (LOCALES as readonly unknown[]).includes(value);
}

export const GERMAN_COUNTRIES: ReadonlySet<string> = new Set(["AT", "CH", "DE", "LI"]);

/** Where French is an official language or the common language of business. */
export const FRENCH_COUNTRIES: ReadonlySet<string> = new Set([
  "BE", "BF", "BI", "BJ", "BL", "CD", "CF", "CG", "CI", "CM", "DJ", "DZ", "FR", "GA", "GF", "GN", "GP", "HT", "KM", "LU", "MA", "MC", "MF", "MG", "ML", "MQ", "NC", "NE", "PF", "PM", "RE", "SN", "TD", "TF", "TG", "TN", "WF", "YT",
]);

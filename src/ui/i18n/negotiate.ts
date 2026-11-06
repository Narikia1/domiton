import { DEFAULT_LOCALE, FRENCH_COUNTRIES, GERMAN_COUNTRIES, isLocale, type Locale } from "../../data/locales.js";

/** The language of a tag such as de-CH, if the app speaks it. */
function languageOf(tag: string): Locale | null {
  const language = tag.trim().slice(0, 2).toLowerCase();
  return isLocale(language) ? language : null;
}

function localeOfCountry(country: string | null | undefined): Locale {
  const code = (country ?? "").toUpperCase();
  if (GERMAN_COUNTRIES.has(code)) return "de";
  return FRENCH_COUNTRIES.has(code) ? "fr" : DEFAULT_LOCALE;
}

/** The country in a tag such as ln-CD. It tells more than the language when the app doesn't speak that. */
export function countryOf(tags: readonly string[]): string | null {
  for (const tag of tags) {
    try {
      const { region } = new Intl.Locale(tag);
      if (region) return region;
    } catch {
      // Not a real tag, so there's nothing to learn from it.
    }
  }
  return null;
}

/** The language to show: what the person chose here, then their device's languages in order, then their country's, then English. */
export function negotiateLocale(choice: string | null | undefined, deviceLanguages: readonly string[], country?: string | null): Locale {
  if (isLocale(choice)) return choice;
  for (const tag of deviceLanguages) {
    const language = languageOf(tag);
    if (language) return language;
  }
  return localeOfCountry(country ?? countryOf(deviceLanguages));
}

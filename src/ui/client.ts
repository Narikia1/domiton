import type { LookupResult } from "../core/types.js";
import type { Locale } from "../data/locales.js";

declare global {
  interface Window {
    /** Only in the desktop apps, which ask the registries themselves instead of going through a server. */
    domiton?: {
      platform: string;
      /** The system's languages, in the person's order, and the country it's set to. */
      languages: readonly string[];
      country: string | null;
      lookup(query: string, locale?: Locale): Promise<LookupResult>;
    };
  }
}

/** The language only changes which similar names come back, so checks on those names leave it out and share answers. */
export async function lookup(query: string, locale?: Locale): Promise<LookupResult> {
  try {
    if (window.domiton) return await window.domiton.lookup(query, locale);
    const language = locale ? `&lang=${locale}` : "";
    const response = await fetch(`/api/lookup?q=${encodeURIComponent(query)}${language}`);
    return (await response.json()) as LookupResult;
  } catch {
    return { ok: false, problem: "offline" };
  }
}

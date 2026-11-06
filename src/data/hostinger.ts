import { HOSTINGER_ENDINGS } from "./hostinger-endings.js";
import type { Locale } from "./locales.js";

/** The owner's referral code, the same one realjaynka.com uses. */
export const HOSTINGER_REFERRAL_CODE = "O38NARIKISRV";

/** Hostinger's site in each language. Each one keeps the code on the way to its referral page. */
const SITES: Record<Locale, string> = { en: "hostinger.com", de: "hostinger.de", fr: "hostinger.fr" };

const SOLD: ReadonlySet<string> = new Set(HOSTINGER_ENDINGS);

/** Where to send someone who wants this ending, or null when Hostinger doesn't sell it. */
export function hostingerLink(ending: string, locale: Locale): string | null {
  return SOLD.has(ending) ? `https://${SITES[locale]}?REFERRALCODE=${HOSTINGER_REFERRAL_CODE}` : null;
}

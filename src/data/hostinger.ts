import { HOSTINGER_ENDINGS } from "./hostinger-endings.js";

/** Narikia's affiliate link. The buttons stay hidden until this is set. */
export const HOSTINGER_AFFILIATE_LINK: string | null = null;

const SOLD: ReadonlySet<string> = new Set(HOSTINGER_ENDINGS);

/** Where to send someone who wants this ending, or null when Hostinger doesn't sell it. */
export function hostingerLink(ending: string, link: string | null = HOSTINGER_AFFILIATE_LINK): string | null {
  return link && SOLD.has(ending) ? link : null;
}

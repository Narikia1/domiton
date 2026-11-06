import { domainToASCII, domainToUnicode } from "node:url";
import { parse } from "tldts";
import type { Refused } from "./types.js";

/** Used when someone types a name without an ending. The app shows it in the ending field. */
export const DEFAULT_ENDING = "com";

export interface Parsed {
  ok: true;
  /** The form registries understand: münchen.de becomes xn--mnchen-3ya.de. */
  ascii: string;
  domain: string;
  name: string;
  ending: string;
}

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Takes the host out of whatever was typed or pasted: a URL, an email address, spaces. */
function hostOf(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/^.*@/, "")
    .replace(/:\d+$/, "")
    .replace(/^\.+|\.+$/g, "");
}

export function isRegistrableLabel(ascii: string): boolean {
  return LABEL.test(ascii) && (ascii.slice(2, 4) !== "--" || ascii.startsWith("xn--"));
}

/** Reads the input as the domain someone could register, so www.example.co.uk is example.co.uk. */
export function parseDomain(input: string): Parsed | Refused {
  const host = hostOf(input);
  if (!host) return { ok: false, problem: "empty" };

  const ascii = domainToASCII(host.includes(".") ? host : `${host}.${DEFAULT_ENDING}`);
  if (!ascii) return { ok: false, problem: "bad-name" };

  const parts = parse(ascii, { allowPrivateDomains: false });
  if (parts.hostname === null) return { ok: false, problem: "bad-name" };
  if (!parts.isIcann || !parts.publicSuffix) {
    return { ok: false, problem: "bad-ending", ending: domainToUnicode(ascii.slice(ascii.lastIndexOf(".") + 1)) };
  }
  // Only an ending was given, such as "co.uk".
  if (!parts.domain || !parts.domainWithoutSuffix) return { ok: false, problem: "bad-name" };
  if (!isRegistrableLabel(parts.domainWithoutSuffix)) return { ok: false, problem: "bad-name" };

  return {
    ok: true,
    ascii: parts.domain,
    domain: domainToUnicode(parts.domain),
    name: domainToUnicode(parts.domainWithoutSuffix),
    ending: domainToUnicode(parts.publicSuffix),
  };
}

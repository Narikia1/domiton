import { domainToASCII } from "node:url";
import { DEFAULT_LOCALE, type Locale } from "../data/locales.js";
import { FRAMES, HYPHENATED_SUFFIXES, NUMBERS, PREFIXES, SUFFIXES } from "../data/name-words.js";
import { isRegistrableLabel } from "./parse.js";

const LATIN = /^[\p{Script=Latin}\p{Number}-]+$/u;

/** Small changes to the name itself, which stay closest to what was typed. */
function respellings(name: string): string[] {
  // narikia becomes narikify, not narikiaify
  const withoutVowels = name.replace(/[aeiouy]+$/, "");
  const stem = withoutVowels.length >= 3 ? withoutVowels : name;
  return [
    ...(name.includes("-") ? [name.replaceAll("-", "")] : []),
    ...(name.endsWith("s") ? [] : [`${name}s`]),
    // flicker becomes flickr
    ...(name.endsWith("er") ? [`${name.slice(0, -2)}r`] : []),
    `${stem}ly`,
    `${stem}ify`,
  ];
}

function alternate<T>(first: readonly T[], second: readonly T[]): T[] {
  const mixed: T[] = [];
  for (let i = 0; i < Math.max(first.length, second.length); i++) {
    if (first[i] !== undefined) mixed.push(first[i] as T);
    if (second[i] !== undefined) mixed.push(second[i] as T);
  }
  return mixed;
}

/** The person's own language first, then the English words that work almost anywhere. */
function latinCandidates(name: string, locale: Locale): string[] {
  const inOrder = (words: Record<Locale, readonly string[]>) => (locale === DEFAULT_LOCALE ? words[DEFAULT_LOCALE] : [...words[locale], ...words[DEFAULT_LOCALE]]);
  return [
    ...respellings(name),
    ...alternate(
      inOrder(SUFFIXES).map((suffix) => `${name}${suffix}`),
      inOrder(PREFIXES).map((prefix) => `${prefix}${name}`),
    ),
    ...HYPHENATED_SUFFIXES.map((suffix) => `${name}-${suffix}`),
    ...FRAMES.map(([prefix, suffix]) => `${prefix}${name}${suffix}`),
  ];
}

function otherScriptCandidates(name: string): string[] {
  return [...(name.includes("-") ? [name.replaceAll("-", "")] : []), ...NUMBERS.map((number) => `${name}${number}`), ...NUMBERS.map((number) => `${name}-${number}`)];
}

/** Other names to try on the same ending, closest first. A search stops as soon as it has enough. */
export function similarNames(name: string, locale: Locale = DEFAULT_LOCALE): string[] {
  const candidates = LATIN.test(name) ? latinCandidates(name, locale) : otherScriptCandidates(name);
  return [...new Set(candidates)].filter((candidate) => candidate !== name && isRegistrableLabel(domainToASCII(`${candidate}.test`).slice(0, -5)));
}

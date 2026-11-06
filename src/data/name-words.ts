import type { Locale } from "./locales.js";

/** Words joined to a name to suggest another. No accents, so the result works on every ending. */
export const PREFIXES: Record<Locale, readonly string[]> = {
  en: ["get", "try", "my", "the", "use", "go", "hey", "join", "hello", "meet", "with", "our", "all", "best", "we", "pure", "smart", "true", "top", "one", "new", "real", "next", "just"],
  de: ["mein", "dein", "unser", "hallo", "top", "neu", "die", "der", "das", "echt"],
  fr: ["mon", "ton", "notre", "le", "la", "les", "bonjour", "super", "vrai", "nouveau"],
};

export const SUFFIXES: Record<Locale, readonly string[]> = {
  en: ["hq", "app", "online", "site", "hub", "now", "web", "labs", "team", "pro", "group", "world", "studio", "direct", "plus", "home", "shop", "store", "cloud", "digital", "media", "space", "zone", "tech", "systems", "global", "network", "works", "club", "co"],
  de: ["online", "shop", "portal", "welt", "haus", "zentrum", "service", "gruppe", "direkt", "profi", "netz", "markt"],
  fr: ["enligne", "boutique", "monde", "maison", "service", "groupe", "direct", "pro", "equipe", "studio", "conseil", "marche"],
};

export const HYPHENATED_SUFFIXES: readonly string[] = ["app", "online", "hq", "site"];

/** Popular names are often gone in every simple form, but rarely in these. */
export const FRAMES: readonly (readonly [string, string])[] = [
  ["get", "app"],
  ["try", "hq"],
  ["my", "online"],
  ["the", "hub"],
  ["use", "now"],
  ["join", "team"],
  ["go", "pro"],
  ["hey", "site"],
  ["meet", "labs"],
  ["hello", "web"],
];

/**
 * A name in another script, such as Cyrillic or Chinese, can't take Latin words: registries
 * refuse labels that mix scripts. Numbers are allowed with every script.
 */
export const NUMBERS: readonly string[] = ["24", "365", "1", "2", "7", "360"];

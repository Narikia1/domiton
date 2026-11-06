import { domainToASCII } from "node:url";
import { isRegistrableLabel } from "./parse.js";

const PREFIXES = [
  "get", "try", "my", "the", "use", "go", "hey", "join", "hello", "meet", "with", "our",
  "all", "best", "we", "pure", "smart", "true", "top", "one", "new", "real", "next", "just",
];
const SUFFIXES = [
  "hq", "app", "online", "site", "hub", "now", "web", "labs", "team", "pro", "group", "world", "studio", "direct", "plus", "home",
  "shop", "store", "cloud", "digital", "media", "space", "zone", "tech", "systems", "global", "network", "works", "club", "co",
];
const HYPHENATED_SUFFIXES = ["app", "online", "hq", "site"];
/** Popular names are often gone in every simple form, but rarely in these. */
const FRAMES = [
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
] as const;

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

/** Other names to try on the same ending, closest first. A search stops as soon as it has enough. */
export function similarNames(name: string): string[] {
  const candidates = [
    ...respellings(name),
    ...alternate(
      SUFFIXES.map((suffix) => `${name}${suffix}`),
      PREFIXES.map((prefix) => `${prefix}${name}`),
    ),
    ...HYPHENATED_SUFFIXES.map((suffix) => `${name}-${suffix}`),
    ...FRAMES.map(([prefix, suffix]) => `${prefix}${name}${suffix}`),
  ];
  return [...new Set(candidates)].filter((candidate) => candidate !== name && isRegistrableLabel(domainToASCII(`${candidate}.test`).slice(0, -5)));
}

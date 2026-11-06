/** Used when someone types a name without an ending. */
export const DEFAULT_ENDING = "com";

/** The longest input either version of the app will read. */
export const MAX_INPUT = 300;

export const LOOKUP = {
  rdapTimeout: 6000,
  whoisTimeout: 6000,
  dnsTimeout: 4000,
  whoisMaxReply: 256 * 1024,
  /** IANA's list of RDAP servers changes rarely. */
  rdapListLife: 24 * 60 * 60 * 1000,
  rdapListRetry: 5 * 60 * 1000,
  /** Waiting out a silent WHOIS server once is enough, so a search doesn't wait for every name. */
  quietFor: 10 * 60 * 1000,
} as const;

/** How long the desktop apps wait to learn the country before using the system's own setting. */
export const LOCATION_TIMEOUT = 3000;

export const SEARCH = {
  /** How many free names a search looks for. Only names that are hard to find free use all the suggestions. */
  target: 12,
  /** Registries limit how fast they answer, so only a few names are asked about at once. */
  atOnce: 4,
  /** After this many names with no answer at all, nobody is answering this search. */
  giveUpAfter: 8,
} as const;

export const SERVER = {
  /** Most searches ask about 20 names and the hardest about 80, so this allows several a minute from one address. */
  requestsPerMinute: 240,
  /** Answers are shared for a few minutes, except when the registry gave none. */
  sharedFor: 300,
} as const;

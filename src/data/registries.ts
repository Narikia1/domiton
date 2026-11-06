/** Who the app asks. IANA's lists are the starting point, so most endings need no entry here. */
export const SOURCES = {
  rdapList: "https://data.iana.org/rdap/dns.json",
  whoisList: "whois.iana.org",
  dnsOverHttps: "https://cloudflare-dns.com/dns-query",
} as const;

/**
 * Registries with a working RDAP server that IANA's list leaves out. Each one here told a
 * registered name from an unregistered one when it was added.
 */
export const UNLISTED_RDAP: Readonly<Record<string, string>> = {
  ch: "https://rdap.nic.ch/",
  li: "https://rdap.nic.li/",
  sy: "https://rdap.nic.sy/",
};

/** The same for WHOIS. IANA's record for these endings names no server, or a dead one. */
export const UNLISTED_WHOIS: Readonly<Record<string, string>> = {
  bz: "whois.identitydigital.services",
  cd: "whois.nic.cd",
  ga: "whois.nic.ga",
  kw: "whois.nic.kw",
  lc: "whois.identitydigital.services",
  ps: "whois.registry.ps",
  sl: "whois.nic.sl",
};

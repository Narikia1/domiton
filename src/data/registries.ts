/** Who the app asks. IANA's lists are the starting point, so most endings need no entry here. */
export const SOURCES = {
  rdapList: "https://data.iana.org/rdap/dns.json",
  whoisList: "whois.iana.org",
  dnsOverHttps: "https://cloudflare-dns.com/dns-query",
} as const;

/** Registries with a working RDAP server that IANA's list leaves out. */
export const UNLISTED_RDAP: Readonly<Record<string, string>> = {
  ch: "https://rdap.nic.ch/",
};

/** Registries with a working WHOIS server that IANA's list leaves out. */
export const UNLISTED_WHOIS: Readonly<Record<string, string>> = {
  cd: "whois.nic.cd",
};

/** What is known about one domain name. */
export interface Check {
  /**
   * free: the registry says it has no record of the name.
   * taken: the registry has a record, or the name has live name servers.
   * likely-free: the registry would not answer, but the name has no DNS at all.
   * unknown: nobody could tell.
   */
  status: "free" | "taken" | "likely-free" | "unknown";
  /** Who answered: the registry, public DNS, or nobody. */
  source: "registry" | "dns" | "none";
  registrar?: string;
  /** ISO dates, as far as the registry shares them. */
  registered?: string;
  expires?: string;
}

export interface Found extends Check {
  ok: true;
  /** The full name as people read it, for example münchen.de. */
  domain: string;
  name: string;
  ending: string;
  /** Similar names on the same ending, closest first. They have not been checked yet. */
  similar: string[];
}

export interface Refused {
  ok: false;
  problem: "empty" | "bad-name" | "bad-ending" | "too-many" | "offline";
  /** The ending that was refused, when the problem is "bad-ending". */
  ending?: string;
}

export type LookupResult = Found | Refused;

/** One way of asking about a name. Null means it could not tell. */
export type Step = (ascii: string) => Promise<Check | null>;

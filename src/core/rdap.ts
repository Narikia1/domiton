import { LOOKUP } from "../data/limits.js";
import { SOURCES, UNLISTED_RDAP } from "../data/registries.js";
import type { Check } from "./types.js";

type Directory = Map<string, string>;

let directory: { servers: Promise<Directory>; until: number } | undefined;

/** One shared copy, because a search asks about many names at once. */
function servers(): Promise<Directory> {
  if (directory && Date.now() < directory.until) return directory.servers;
  const current = {
    until: Date.now() + LOOKUP.rdapListLife,
    servers: fetchDirectory().catch(() => {
      current.until = Date.now() + LOOKUP.rdapListRetry;
      return new Map() as Directory;
    }),
  };
  directory = current;
  return current.servers;
}

async function fetchDirectory(): Promise<Directory> {
  const response = await fetch(SOURCES.rdapList, { signal: AbortSignal.timeout(LOOKUP.rdapTimeout) });
  if (!response.ok) throw new Error(`RDAP directory answered ${response.status}`);
  return readDirectory(await response.json());
}

export function readDirectory(body: unknown): Directory {
  const found: Directory = new Map();
  const services = (body as { services?: [string[], string[]][] }).services ?? [];
  for (const [endings, urls] of services) {
    const url = urls.find((candidate) => candidate.startsWith("https://")) ?? urls[0];
    if (url) for (const ending of endings) found.set(ending.toLowerCase(), url.replace(/\/*$/, "/"));
  }
  return found;
}

/** The most specific server wins: a.co.uk looks for co.uk before uk. */
export function serverFor(ascii: string, known: Directory): string | undefined {
  const labels = ascii.split(".");
  for (let i = 1; i < labels.length; i++) {
    const ending = labels.slice(i).join(".");
    const server = known.get(ending) ?? UNLISTED_RDAP[ending];
    if (server) return server;
  }
  return undefined;
}

interface RdapDomain {
  objectClassName?: string;
  ldhName?: string;
  events?: { eventAction?: string; eventDate?: string }[];
  entities?: { roles?: string[]; vcardArray?: [string, [string, unknown, string, unknown][]] }[];
}

/** Null if the body is not a domain record, so an error page is never read as "taken". */
export function readRecord(body: unknown): Check | null {
  const record = body as RdapDomain | null;
  if (!record || (record.objectClassName !== "domain" && !record.ldhName)) return null;

  const eventDate = (action: string) => record.events?.find((event) => event.eventAction === action)?.eventDate;
  const registrar = record.entities
    ?.find((entity) => entity.roles?.includes("registrar"))
    ?.vcardArray?.[1]?.find((field) => field[0] === "fn")?.[3];

  return {
    status: "taken",
    source: "registry",
    ...(typeof registrar === "string" && registrar ? { registrar } : {}),
    ...(eventDate("registration") ? { registered: eventDate("registration") } : {}),
    ...(eventDate("expiration") ? { expires: eventDate("expiration") } : {}),
  };
}

/**
 * A record means taken. A 404 means free, unless it is a web page: the .ng server answers every
 * name with an HTML 404, including names that exist. Anything else, such as a rate limit, says nothing.
 */
export async function rdapCheck(ascii: string): Promise<Check | null> {
  const server = serverFor(ascii, await servers());
  if (!server) return null;

  const response = await fetch(`${server}domain/${ascii}`, {
    headers: { accept: "application/rdap+json", "user-agent": "Domiton" },
    signal: AbortSignal.timeout(LOOKUP.rdapTimeout),
  });
  if (response.status === 404) {
    return response.headers.get("content-type")?.includes("html") ? null : { status: "free", source: "registry" };
  }
  if (!response.ok) return null;
  return readRecord(await response.json());
}

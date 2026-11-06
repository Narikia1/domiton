import { connect } from "node:net";
import { LOOKUP } from "../data/limits.js";
import { SOURCES, UNLISTED_WHOIS } from "../data/registries.js";
import type { Check } from "./types.js";

const PORT = 43;

/** The registry is refusing to answer. This never says anything about the name. */
const REFUSED =
  /limit exceeded|rate limit|too many|try again|temporarily|quota|not authori[sz]ed|not permitted|access denied|denied|blocked|connection refused|service unavailable/i;

/** Where the record ends and the registry's legal notices begin. */
const NOTICES = /^\s*(?:>>>|terms of use|notice:|disclaimer)/i;
const COMMENT = /^\s*(?:%|#|;)/;

/** Lines that only appear when a name is free. These are checked first, as .de replies "Domain: x.de / Status: free". */
const STATUS_FREE = /^\s*(?:(?:domain |registration )?status)\s*:\s*(?:free|available)\b|^\s*available\s*$/im;

/**
 * Lines that only appear in a real registration record, in whichever language the registry
 * uses: .bo says "Titular", .ga "Date de création", and .tm spaces its colons as "Expiry : 2027".
 */
const REGISTERED =
  /^\s*(?:creation date|created(?: on)?|record created|domainname|registered(?: on)?|registration time|expiration time|registrar|registrar url|registrar whois server|registry domain id|domain id|roid|sponsoring registrar|registrant(?: name| organi[sz]ation)?|titular|date de création|name ?servers?|nserver|ns\s*\d+|holder(?: of domain name)?|expiry(?: date)?|registry expiry date|changed|status\s*:\s*(?:connect|active|registered|ok|client)|registration status\s*:\s*(?:busy|active)|domain status\s*:\s*(?:client|server|active|ok))\b[^\n]*(?::|$)|^\s*(?:[a-z]\.\s*)?\[(?:domain name|registrant|name server|created on)\]/im;

/** The sentences registries use for a name they have no record of, in English and their own languages. */
const NOT_FOUND =
  /no match|not found|no data found|no entries found|no entry found|no information available|no object found|object does not exist|queried object does not exist|is free\b|is available\b|is available for purchase|not registered|not been registered|we do not have an entry|no such domain|nothing found|domain unknown|object_not_found|no_se_encontro|no se encuentra registrado|nincs talalat|no record found|no found\b/i;

/**
 * Some registries give the answer in a line that looks like a comment or a notice:
 * "%ERROR:101: no entries found" on .ir, "%% NOT FOUND" on .ga, ">>> Domain not Found" on .ug.
 * Legal text fills those lines too, so only a line that starts with the answer counts.
 */
const ANSWER_IN_NOTICE =
  /^\s*(?:%+\s*(?:error:\s*(?:\d+:\s*)?)?|#+\s*|>>>\s*)(?:no match|no matching record|no entries found|no entry found|no such domain|no data (?:was )?found|nothing found|not found|object not found|domain not found|domain is not registered|domain \S+ is available for registration)\b/im;

/** Reads a registry's reply. Null means it can't be read with confidence. */
export function readWhois(reply: string): "free" | "taken" | null {
  // Legal notices can mention any of the words below, so only the record itself is read.
  const lines = reply.split(/\r?\n/);
  const end = lines.findIndex((line) => NOTICES.test(line));
  const body = (end === -1 ? lines : lines.slice(0, end)).filter((line) => !COMMENT.test(line)).join("\n");
  if (STATUS_FREE.test(body)) return "free";
  if (REGISTERED.test(body)) return "taken";
  if (REFUSED.test(body)) return null;
  if (NOT_FOUND.test(body) || ANSWER_IN_NOTICE.test(reply)) return "free";
  return null;
}

const FIELDS = {
  registrar: /^[ \t]*(?:sponsoring )?registrar[ \t]*:[ \t]*(\S.*)$/im,
  registered: /^[ \t]*(?:creation date|created(?: on)?|record created|domainname|registered(?: on)?|registration time|date de création)[ \t]*:[ \t]*(\S.*)$/im,
  expires: /^[ \t]*(?:registry expiry date|expiry date|expiry|expiration date|expires(?: on)?|expiration time|paid-till)[ \t]*:[ \t]*(\S.*)$/im,
};

/** What a record shares. Registries word this differently, so anything not recognised is simply left out. */
export function readDetails(reply: string): Pick<Check, "registrar" | "registered" | "expires"> {
  const value = (pattern: RegExp) => pattern.exec(reply)?.[1]?.replace(/\s*\(.*\)\s*$/, "").trim();
  const registrar = value(FIELDS.registrar);
  const registered = value(FIELDS.registered);
  const expires = value(FIELDS.expires);
  return { ...(registrar ? { registrar } : {}), ...(registered ? { registered } : {}), ...(expires ? { expires } : {}) };
}

function ask(host: string, question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const socket = connect({ host, port: PORT });
    socket.setTimeout(LOOKUP.whoisTimeout);
    socket.on("connect", () => socket.write(`${question}\r\n`));
    socket.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
      size += chunk.length;
      if (size > LOOKUP.whoisMaxReply) socket.destroy(new Error("WHOIS reply too long"));
    });
    socket.on("timeout", () => socket.destroy(new Error("WHOIS timed out")));
    socket.on("error", reject);
    socket.on("close", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

const servers = new Map<string, Promise<string | null>>();

/** IANA's record for an ending. Its line can be empty, as for .cd, and then it names no server. */
export function readServer(reply: string): string | null {
  return /^whois:[ \t]*(\S+)/im.exec(reply)?.[1] ?? null;
}

/** IANA says which server answers for most endings, and our own list adds the ones it leaves out. */
function serverFor(tld: string): Promise<string | null> {
  const unlisted = UNLISTED_WHOIS[tld];
  if (unlisted) return Promise.resolve(unlisted);
  const known = servers.get(tld);
  if (known) return known;
  const pending = ask(SOURCES.whoisList, tld).then(readServer);
  servers.set(tld, pending);
  // A failed or empty answer is not remembered, so the next search asks again.
  const forget = () => servers.delete(tld);
  pending.then((server) => server ?? forget(), forget);
  return pending;
}

/** Some registries never reply. */
const quietUntil = new Map<string, number>();

export async function whoisCheck(ascii: string): Promise<Check | null> {
  const server = await serverFor(ascii.slice(ascii.lastIndexOf(".") + 1));
  if (!server || (quietUntil.get(server) ?? 0) > Date.now()) return null;

  try {
    const reply = await ask(server, ascii);
    const answer = readWhois(reply);
    if (!answer) return null;
    return { status: answer, source: "registry", ...(answer === "taken" ? readDetails(reply) : {}) };
  } catch (error) {
    quietUntil.set(server, Date.now() + LOOKUP.quietFor);
    throw error;
  }
}

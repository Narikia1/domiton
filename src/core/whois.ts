import { connect } from "node:net";
import type { Check } from "./types.js";

const IANA = "whois.iana.org";
const PORT = 43;
const TIMEOUT = 6000;
const MAX_REPLY = 256 * 1024;

/** The registry is refusing to answer. This never says anything about the name. */
const REFUSED =
  /limit exceeded|rate limit|too many|try again|temporarily|quota|not authori[sz]ed|not permitted|access denied|denied|blocked|connection refused|service unavailable/i;

/** Where the record ends and the registry's legal notices begin. */
const NOTICES = /^\s*(?:>>>|terms of use|notice:|disclaimer)/i;
const COMMENT = /^\s*(?:%|#|;)/;

/** Lines that only appear when a name is free. These are checked first, as .de replies "Domain: x.de / Status: free". */
const STATUS_FREE = /^\s*(?:domain )?status:\s*(?:free|available)\b/im;

/** Lines that only appear in a real registration record. */
const REGISTERED =
  /^\s*(?:creation date|created(?: on)?|registered(?: on)?|registrar|registrar url|registrar whois server|sponsoring registrar|registrant(?: name| organi[sz]ation)?|name ?servers?|nserver|holder(?: of domain name)?|expiry date|registry expiry date|changed|status:\s*(?:connect|active|registered|ok|client))\b[^\n]*(?::|$)/im;

/** The sentences registries use for a name they have no record of. */
const NOT_FOUND =
  /no match|not found|no data found|no entries found|no entry found|no information available|no object found|object does not exist|queried object does not exist|is free\b|is available\b|not registered|not been registered|we do not have an entry|no such domain|nothing found|domain unknown/i;

/** Reads a registry's reply. Null means it can't be read with confidence. */
export function readWhois(reply: string): "free" | "taken" | null {
  // Legal notices can mention any of the words below, so only the record itself is read.
  const lines = reply.split(/\r?\n/);
  const end = lines.findIndex((line) => NOTICES.test(line));
  const body = (end === -1 ? lines : lines.slice(0, end)).filter((line) => !COMMENT.test(line)).join("\n");
  if (!body.trim()) return null;

  if (STATUS_FREE.test(body)) return "free";
  if (REGISTERED.test(body)) return "taken";
  if (REFUSED.test(body)) return null;
  if (NOT_FOUND.test(body)) return "free";
  return null;
}

function ask(host: string, question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const socket = connect({ host, port: PORT });
    socket.setTimeout(TIMEOUT);
    socket.on("connect", () => socket.write(`${question}\r\n`));
    socket.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
      size += chunk.length;
      if (size > MAX_REPLY) socket.destroy(new Error("WHOIS reply too long"));
    });
    socket.on("timeout", () => socket.destroy(new Error("WHOIS timed out")));
    socket.on("error", reject);
    socket.on("close", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

const servers = new Map<string, Promise<string | null>>();

/** IANA says which server answers for each ending, so no list has to be kept up to date here. */
function serverFor(tld: string): Promise<string | null> {
  const known = servers.get(tld);
  if (known) return known;
  const pending = ask(IANA, tld).then((reply) => /^whois:\s*(\S+)/im.exec(reply)?.[1] ?? null);
  servers.set(tld, pending);
  // A failed or empty answer is not remembered, so the next search asks again.
  const forget = () => servers.delete(tld);
  pending.then((server) => server ?? forget(), forget);
  return pending;
}

/** Some registries never reply. Waiting out the timeout once is enough, so a search doesn't wait for every name. */
const QUIET_FOR = 10 * 60 * 1000;
const quietUntil = new Map<string, number>();

export async function whoisCheck(ascii: string): Promise<Check | null> {
  const server = await serverFor(ascii.slice(ascii.lastIndexOf(".") + 1));
  if (!server || (quietUntil.get(server) ?? 0) > Date.now()) return null;

  try {
    const answer = readWhois(await ask(server, ascii));
    return answer ? { status: answer, source: "registry" } : null;
  } catch (error) {
    quietUntil.set(server, Date.now() + QUIET_FOR);
    throw error;
  }
}

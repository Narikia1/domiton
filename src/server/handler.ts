import { lookup } from "../core/lookup.js";
import type { LookupResult } from "../core/types.js";

const MAX_INPUT = 300;
/** Most searches ask about 20 names and the hardest about 80, so this allows several a minute from one address. */
const REQUESTS_PER_MINUTE = 240;
const MINUTE = 60_000;

const windows = new Map<string, { started: number; used: number }>();

/** Protects the registries from this server being used as a bulk checker. Counted per server instance. */
export function overLimit(address: string, now = Date.now()): boolean {
  const current = windows.get(address);
  if (!current || now - current.started >= MINUTE) {
    if (windows.size > 10_000) windows.clear();
    windows.set(address, { started: now, used: 1 });
    return false;
  }
  current.used++;
  return current.used > REQUESTS_PER_MINUTE;
}

function reply(result: LookupResult, status: number, cache: string): Response {
  return Response.json(result, { status, headers: { "cache-control": cache } });
}

export async function handleLookup(request: Request): Promise<Response> {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (overLimit(address)) return reply({ ok: false, problem: "too-many" }, 429, "no-store");

  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (query.length > MAX_INPUT) return reply({ ok: false, problem: "bad-name" }, 400, "no-store");

  const result = await lookup(query);
  if (!result.ok) return reply(result, 400, "no-store");
  // Answers are shared for a few minutes, except when the registry gave none.
  return reply(result, 200, result.status === "unknown" ? "no-store" : "public, max-age=0, s-maxage=300");
}

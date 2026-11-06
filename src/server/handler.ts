import { lookup } from "../core/lookup.js";
import type { LookupResult } from "../core/types.js";
import { MAX_INPUT, SERVER } from "../data/limits.js";
import { DEFAULT_LOCALE, isLocale } from "../data/locales.js";

const MINUTE = 60_000;
/** Vercel sets this on every request, from the visitor's address. */
const COUNTRY_HEADER = "x-vercel-ip-country";

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
  return current.used > SERVER.requestsPerMinute;
}

function reply(result: LookupResult, status: number, cache: string): Response {
  return Response.json(result, { status, headers: { "cache-control": cache } });
}

export async function handleLookup(request: Request): Promise<Response> {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (overLimit(address)) return reply({ ok: false, problem: "too-many" }, 429, "no-store");

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const language = searchParams.get("lang");
  if (query.length > MAX_INPUT) return reply({ ok: false, problem: "bad-name" }, 400, "no-store");

  const result = await lookup(query, isLocale(language) ? language : DEFAULT_LOCALE);
  if (!result.ok) return reply(result, 400, "no-store");
  return reply(result, 200, result.status === "unknown" ? "no-store" : `public, max-age=0, s-maxage=${SERVER.sharedFor}`);
}

/** The country the visitor is in, for choosing a language. Nothing is kept. */
export function handleCountry(request: Request): Response {
  return Response.json({ country: request.headers.get(COUNTRY_HEADER) }, { headers: { "cache-control": "no-store" } });
}

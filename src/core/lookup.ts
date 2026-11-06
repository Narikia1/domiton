import { checkDomain } from "./check.js";
import { parseDomain } from "./parse.js";
import { similarNames } from "./similar.js";
import type { LookupResult } from "./types.js";

/** The one question every version of the app asks: the website's server and the desktop apps both call this. */
export async function lookup(input: string): Promise<LookupResult> {
  const parsed = parseDomain(input);
  if (!parsed.ok) return parsed;

  const { ascii, domain, name, ending } = parsed;
  const check = await checkDomain(ascii);
  return {
    ok: true,
    ...check,
    domain,
    name,
    ending,
    similar: similarNames(name).map((similar) => `${similar}.${ending}`),
  };
}

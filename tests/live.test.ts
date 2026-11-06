import { describe, expect, it } from "vitest";
import { checkDomain } from "../src/core/check.js";

/**
 * Asks the real registries, so it only runs on request (npm run test:live).
 * For each ending, one name that is certainly registered and one that certainly is not.
 */
const ENDINGS = [
  "com", "net", "org", "info", "biz", "app", "dev", "xyz", "online", "store", "tech", "site",
  "ai", "io", "co", "me", "tv", "de", "fr", "co.uk", "eu", "nl", "be", "ch", "it", "ca", "us", "com.au", "cm",
  // Around the world, including endings IANA names no server for.
  "cd", "at", "jp", "cn", "ru", "com.br", "in", "pl", "ir", "tn", "ar", "bz", "ga", "kw", "lc",
];

/** These registries don't answer public lookups, so the most the app can say about a free name is "likely". */
const NO_PUBLIC_LOOKUP = ["shop", "es", "com.ng", "pt"];

const random = Math.random().toString(36).slice(2, 10);

async function report(ending: string) {
  const taken = await checkDomain(`google.${ending}`);
  const free = await checkDomain(`zqxv-domiton-${random}.${ending}`);
  console.log(`${ending.padEnd(7)} google: ${`${taken.status}/${taken.source}`.padEnd(16)} random: ${free.status}/${free.source}`);
  return { taken, free };
}

describe.runIf(process.env.LIVE)("real registries", () => {
  it.each(ENDINGS)(".%s tells registered from free", async (ending) => {
    const { taken, free } = await report(ending);
    expect(taken.status).toBe("taken");
    expect(free.status).toBe("free");
  }, 60_000);

  it.each(NO_PUBLIC_LOOKUP)(".%s never claims more than the registry told it", async (ending) => {
    const { taken, free } = await report(ending);
    expect(taken.status).toBe("taken");
    expect(free.status).toBe("likely-free");
  }, 60_000);
});

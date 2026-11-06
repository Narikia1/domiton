import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND } from "../src/data/brand.js";
import { hostingerLink } from "../src/data/hostinger.js";
import { HOSTINGER_ENDINGS } from "../src/data/hostinger-endings.js";
import { isLocale, LOCALE_NAMES, LOCALES } from "../src/data/locales.js";
import { PREFIXES, SUFFIXES } from "../src/data/name-words.js";
import { UNLISTED_RDAP, UNLISTED_WHOIS } from "../src/data/registries.js";

describe("Hostinger's endings", () => {
  it("come out of Hostinger's catalogue sorted and clean", () => {
    expect([...HOSTINGER_ENDINGS]).toEqual([...new Set(HOSTINGER_ENDINGS)].sort());
    for (const ending of HOSTINGER_ENDINGS) expect(ending).toMatch(/^[a-z0-9.-]+$/);
    expect(HOSTINGER_ENDINGS.length).toBeGreaterThan(100);
  });

  it("offer the link only for what Hostinger sells", () => {
    expect(hostingerLink("com", "en")).not.toBeNull();
    expect(hostingerLink("co.uk", "en")).not.toBeNull();
    expect(hostingerLink("cd", "en")).toBeNull();
    expect(hostingerLink("xn--p1ai", "en")).toBeNull();
  });

  it("open Hostinger in the person's language, always with Jay's code", () => {
    expect(hostingerLink("com", "en")).toBe("https://hostinger.com?REFERRALCODE=O38NARIKISRV");
    expect(hostingerLink("com", "de")).toBe("https://hostinger.de?REFERRALCODE=O38NARIKISRV");
    expect(hostingerLink("com", "fr")).toBe("https://hostinger.fr?REFERRALCODE=O38NARIKISRV");
  });
});

describe("the one place for each fact", () => {
  it("depends on nothing else in the app", () => {
    for (const file of readdirSync("src/data")) {
      expect(readFileSync(join("src/data", file), "utf8"), file).not.toMatch(/from "\.\.\//);
    }
  });

  it("names the app the same way as its installers", () => {
    expect(JSON.parse(readFileSync("package.json", "utf8")).productName).toBe(BRAND.name);
    expect(readFileSync("electron-builder.yml", "utf8")).toContain(`productName: ${BRAND.name}`);
  });

  it("has every language it speaks packed in the desktop apps", () => {
    expect(readFileSync("electron-builder.yml", "utf8")).toContain(`electronLanguages: [${LOCALES.join(", ")}]`);
  });

  it("names every language in itself", () => {
    for (const locale of LOCALES) expect(LOCALE_NAMES[locale].length).toBeGreaterThan(0);
    expect(isLocale("de")).toBe(true);
    expect(isLocale("xx")).toBe(false);
  });

  it("keeps the words for suggestions free of accents, so they work on every ending", () => {
    for (const locale of LOCALES) for (const word of [...PREFIXES[locale], ...SUFFIXES[locale]]) expect(word).toMatch(/^[a-z]+$/);
  });

  it("lists registry servers in a form the lookups can use", () => {
    for (const [ending, server] of Object.entries(UNLISTED_RDAP)) {
      expect(ending).toMatch(/^[a-z0-9-]+$/);
      expect(server).toMatch(/^https:\/\/.+\/$/);
    }
    for (const [ending, host] of Object.entries(UNLISTED_WHOIS)) {
      expect(ending).toMatch(/^[a-z0-9-]+$/);
      expect(host).toMatch(/^[a-z0-9.-]+$/);
    }
    expect(UNLISTED_WHOIS.cd).toBe("whois.nic.cd");
    expect(UNLISTED_RDAP.ch).toBe("https://rdap.nic.ch/");
  });
});

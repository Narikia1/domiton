import { describe, expect, it } from "vitest";
import { LOCALES } from "../src/data/locales.js";
import type { MessageKey } from "../src/ui/i18n/messages.js";
import { CATALOGS, translator } from "../src/ui/i18n/messages.js";
import { countryOf, negotiateLocale } from "../src/ui/i18n/negotiate.js";

describe("choosing the language", () => {
  it("prefers what the person chose here", () => {
    expect(negotiateLocale("fr", ["de-DE"])).toBe("fr");
  });

  it("then follows the device's languages, in order, whatever the country", () => {
    expect(negotiateLocale(null, ["de-CH", "en"])).toBe("de");
    expect(negotiateLocale(null, ["en-US"], "CD")).toBe("en");
    expect(negotiateLocale(null, ["sw-KE", "fr"], "DE")).toBe("fr");
  });

  it("then the country's language, when the device has none of ours", () => {
    expect(negotiateLocale(null, ["ln-CD"])).toBe("fr");
    expect(negotiateLocale(null, ["es-ES"], "AT")).toBe("de");
    expect(negotiateLocale(null, ["es-ES"], "ES")).toBe("en");
  });

  it("and English when nothing else is known", () => {
    expect(negotiateLocale(null, [])).toBe("en");
    expect(negotiateLocale("xx", ["es"], null)).toBe("en");
  });

  it("finds a country in a language tag, and survives a bad one", () => {
    expect(countryOf(["ln-CD"])).toBe("CD");
    expect(countryOf(["es", "de-AT"])).toBe("AT");
    expect(countryOf(["not a tag"])).toBeNull();
  });
});

describe("the catalogues", () => {
  const keys = Object.keys(CATALOGS.en) as MessageKey[];

  it("have the same placeholders in every language", () => {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(",");
    for (const key of keys) {
      for (const locale of LOCALES) expect(placeholders(CATALOGS[locale][key]), `${locale}:${key}`).toBe(placeholders(CATALOGS.en[key]));
    }
  });

  it("are translated, apart from words that are the same in that language", () => {
    const sameInGerman = new Set<MessageKey>(["fact.registrar"]);
    const sameInFrench = new Set<MessageKey>(["action.copyNamed"]);
    for (const key of keys) {
      if (!sameInGerman.has(key)) expect(CATALOGS.de[key], `de:${key}`).not.toBe(CATALOGS.en[key]);
      if (!sameInFrench.has(key)) expect(CATALOGS.fr[key], `fr:${key}`).not.toBe(CATALOGS.en[key]);
    }
  });

  // A plain space would let a line break before the punctuation.
  it("use French non-breaking spaces before ? ! : ; and inside « »", () => {
    for (const key of keys) expect(CATALOGS.fr[key], `fr:${key}`).not.toMatch(/ [?!:;»]|« /);
  });

  it("use each language's own quotation marks and apostrophes", () => {
    for (const key of keys) {
      expect(CATALOGS.de[key], `de:${key}`).not.toContain('"');
      expect(CATALOGS.fr[key], `fr:${key}`).not.toMatch(/["']/);
    }
  });

  it("quote the same words the buttons and answers use", () => {
    for (const locale of LOCALES) {
      const catalog = CATALOGS[locale];
      expect(catalog["similar.unconfirmed"], locale).toContain(catalog["status.likelyFree"]);
      expect(catalog["affiliate.note"], locale).toContain(catalog["action.get"]);
      // A screen reader's label has to hold the words on the button (WCAG 2.5.3).
      expect(catalog["action.getNamed"].toLowerCase(), locale).toContain(catalog["action.get"].toLowerCase());
    }
  });
});

describe("the translator", () => {
  it("fills in brand words and values", () => {
    expect(translator("en").t("family.line")).toBe("A Narikia app in the DotGo family");
    expect(translator("de").t("similar.title", { ending: "de" })).toBe("Frei mit .de");
  });

  it("writes dates the way each language does, and refuses a bad one", () => {
    expect(translator("de").date("2028-09-14T04:00:00Z")).toContain("2028");
    expect(translator("fr").date("2028-09-14T04:00:00Z")).toMatch(/sept/);
    expect(translator("en").date("not a date")).toBeNull();
  });
});

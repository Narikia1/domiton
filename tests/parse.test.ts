import { describe, expect, it } from "vitest";
import { parseDomain } from "../src/core/parse.js";

describe("reading what someone typed", () => {
  it.each([
    ["narikia.com", "narikia.com"],
    ["  NARIKIA.COM  ", "narikia.com"],
    ["my cool shop.com", "mycoolshop.com"],
    ["https://www.narikia.com/about?x=1#top", "narikia.com"],
    ["www.narikia.co.uk", "narikia.co.uk"],
    ["mail.narikia.com:8443", "narikia.com"],
    ["me@narikia.com", "narikia.com"],
    ["narikia.com.", "narikia.com"],
  ])("%s means %s", (input, domain) => {
    expect(parseDomain(input)).toMatchObject({ ok: true, domain });
  });

  it("uses .com when no ending is typed", () => {
    expect(parseDomain("narikia")).toMatchObject({ ok: true, domain: "narikia.com", name: "narikia", ending: "com" });
  });

  it("keeps endings of two parts together", () => {
    expect(parseDomain("narikia.co.uk")).toMatchObject({ name: "narikia", ending: "co.uk" });
    expect(parseDomain("narikia.com.au")).toMatchObject({ name: "narikia", ending: "com.au" });
  });

  it("sends registries the coded form of accented names and shows people the readable one", () => {
    expect(parseDomain("münchen.de")).toMatchObject({ ascii: "xn--mnchen-3ya.de", domain: "münchen.de", name: "münchen" });
    expect(parseDomain("xn--mnchen-3ya.de")).toMatchObject({ domain: "münchen.de" });
  });

  it("checks the domain itself on hosting names like github.io", () => {
    expect(parseDomain("someone.github.io")).toMatchObject({ domain: "github.io", ending: "io" });
  });

  it.each(["", "   ", "https://", "..."])("asks for a name when given %j", (input) => {
    expect(parseDomain(input)).toEqual({ ok: false, problem: "empty" });
  });

  it.each(["-narikia.com", "narikia-.com", "na--rikia.com", "nari_kia.com", "nari!kia.com", `${"a".repeat(64)}.com`, "co.uk"])("refuses the name %s", (input) => {
    expect(parseDomain(input)).toMatchObject({ ok: false, problem: "bad-name" });
  });

  it("names the ending it can't find", () => {
    expect(parseDomain("hello.notanending")).toEqual({ ok: false, problem: "bad-ending", ending: "notanending" });
    expect(parseDomain("hello.local")).toEqual({ ok: false, problem: "bad-ending", ending: "local" });
  });
});

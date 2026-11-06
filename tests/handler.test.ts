import { beforeEach, describe, expect, it, vi } from "vitest";
import { lookup } from "../src/core/lookup.js";
import type { Found } from "../src/core/types.js";
import { handleCountry, handleLookup, overLimit } from "../src/server/handler.js";

vi.mock("../src/core/lookup.js", () => ({ lookup: vi.fn() }));
const answer = vi.mocked(lookup);

let address = 0;
const request = (query: string) =>
  new Request(`https://domiton.test/api/lookup?q=${encodeURIComponent(query)}`, { headers: { "x-forwarded-for": `10.0.0.${++address}, 192.0.2.1` } });

const found = (status: Found["status"]): Found => ({ ok: true, status, source: "registry", domain: "a.com", name: "a", ending: "com", similar: [] });

describe("the lookup API", () => {
  beforeEach(() => answer.mockReset());

  it.each(["free", "taken", "likely-free"] as const)("lets the CDN share a %s answer for a few minutes", async (status) => {
    answer.mockResolvedValue(found(status));
    const response = await handleLookup(request("a.com"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, max-age=0, s-maxage=300");
    expect(await response.json()).toMatchObject({ status });
  });

  it("doesn't let the CDN keep an answer nobody could give", async () => {
    answer.mockResolvedValue(found("unknown"));
    const response = await handleLookup(request("a.com"));
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("answers 400 to a bad name", async () => {
    answer.mockResolvedValue({ ok: false, problem: "bad-name" });
    const response = await handleLookup(request("-a.com"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, problem: "bad-name" });
  });

  it("passes on a language it speaks, and ignores any other", async () => {
    answer.mockResolvedValue(found("free"));
    await handleLookup(new Request("https://domiton.test/api/lookup?q=a.com&lang=de", { headers: { "x-forwarded-for": "10.1.0.1" } }));
    expect(answer).toHaveBeenLastCalledWith("a.com", "de");
    await handleLookup(new Request("https://domiton.test/api/lookup?q=a.com&lang=xx", { headers: { "x-forwarded-for": "10.1.0.2" } }));
    expect(answer).toHaveBeenLastCalledWith("a.com", "en");
  });

  it("won't read an enormous input", async () => {
    const response = await handleLookup(request("a".repeat(301)));
    expect(response.status).toBe(400);
    expect(answer).not.toHaveBeenCalled();
  });

  it("answers 429 and stops asking once one address has used up its minute", async () => {
    answer.mockResolvedValue(found("free"));
    const from = { headers: { "x-forwarded-for": "198.51.100.7" } };
    for (let i = 0; i < 240; i++) overLimit("198.51.100.7");
    const response = await handleLookup(new Request("https://domiton.test/api/lookup?q=a.com", from));
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ ok: false, problem: "too-many" });
    expect(answer).not.toHaveBeenCalled();
  });
});

describe("the limit per address", () => {
  it("resets after a minute and counts addresses apart", () => {
    const start = 1_000_000;
    for (let i = 0; i < 240; i++) expect(overLimit("203.0.113.1", start)).toBe(false);
    expect(overLimit("203.0.113.1", start)).toBe(true);
    expect(overLimit("203.0.113.2", start)).toBe(false);
    expect(overLimit("203.0.113.1", start + 60_000)).toBe(false);
  });
});

describe("the country API", () => {
  it("passes on the country Vercel found, and lets nobody keep it", async () => {
    const response = handleCountry(new Request("https://domiton.test/api/country", { headers: { "x-vercel-ip-country": "CD" } }));
    expect(await response.json()).toEqual({ country: "CD" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("says so when it doesn't know", async () => {
    expect(await handleCountry(new Request("https://domiton.test/api/country")).json()).toEqual({ country: null });
  });
});

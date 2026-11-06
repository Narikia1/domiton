import { afterEach, describe, expect, it, vi } from "vitest";
import { rdapCheck, readDirectory, readRecord, serverFor } from "../src/core/rdap.js";

const directory = readDirectory({
  services: [
    [["com", "net"], ["http://rdap.example/com/", "https://rdap.example/com/"]],
    [["uk"], ["https://rdap.example/uk"]],
    [["co.uk"], ["https://rdap.example/co-uk/"]],
  ],
});

describe("the list of RDAP servers", () => {
  it("prefers https and always ends in a slash", () => {
    expect(serverFor("a.com", directory)).toBe("https://rdap.example/com/");
    expect(serverFor("a.uk", directory)).toBe("https://rdap.example/uk/");
  });

  it("picks the most specific ending", () => {
    expect(serverFor("a.co.uk", directory)).toBe("https://rdap.example/co-uk/");
  });

  it("knows the servers IANA leaves out", () => {
    expect(serverFor("a.ch", directory)).toBe("https://rdap.nic.ch/");
  });

  it("has nothing for an ending with no server", () => {
    expect(serverFor("a.de", directory)).toBeUndefined();
  });
});

describe("reading a domain record", () => {
  it("collects what the registry shares", () => {
    const record = {
      objectClassName: "domain",
      ldhName: "GOOGLE.COM",
      events: [
        { eventAction: "registration", eventDate: "1997-09-15T04:00:00Z" },
        { eventAction: "expiration", eventDate: "2028-09-14T04:00:00Z" },
      ],
      entities: [
        { roles: ["abuse"], vcardArray: ["vcard", [["fn", {}, "text", "Abuse desk"]]] },
        { roles: ["registrar"], vcardArray: ["vcard", [["version", {}, "text", "4.0"], ["fn", {}, "text", "MarkMonitor Inc."]]] },
      ],
    };
    expect(readRecord(record)).toEqual({
      status: "taken",
      source: "registry",
      registrar: "MarkMonitor Inc.",
      registered: "1997-09-15T04:00:00Z",
      expires: "2028-09-14T04:00:00Z",
    });
  });

  it("is happy with a bare record", () => {
    expect(readRecord({ objectClassName: "domain" })).toEqual({ status: "taken", source: "registry" });
  });

  it.each([[null], [{}], [{ errorCode: 500 }]])("does not call %j a record", (body) => {
    expect(readRecord(body)).toBeNull();
  });
});

describe("asking a server", () => {
  afterEach(() => vi.unstubAllGlobals());

  function serverAnswers(status: number, contentType: string | null, body = "") {
    vi.stubGlobal("fetch", async (url: string) =>
      url.includes("data.iana.org")
        ? Response.json({ services: [[["com"], ["https://rdap.example/"]]] })
        : new Response(status === 404 || body ? body : null, { status, headers: contentType ? { "content-type": contentType } : {} }),
    );
  }

  it.each([
    ["RDAP's own type, empty, as .com sends", "application/rdap+json"],
    ["plain JSON, as .fr sends", "application/json"],
    ["no type at all, as .ch sends", null],
  ])("a 404 with %s means free", async (_, contentType) => {
    serverAnswers(404, contentType);
    await expect(rdapCheck("a.com")).resolves.toEqual({ status: "free", source: "registry" });
  });

  it("an HTML 404 says nothing, because .ng sends one even for names that exist", async () => {
    serverAnswers(404, "text/html;charset=utf-8", "<!doctype html><title>404</title>");
    await expect(rdapCheck("a.com")).resolves.toBeNull();
  });

  it.each([403, 429, 500, 503])("a %i says nothing", async (status) => {
    serverAnswers(status, "application/json", "{}");
    await expect(rdapCheck("a.com")).resolves.toBeNull();
  });

  it("a record means taken", async () => {
    serverAnswers(200, "application/rdap+json", JSON.stringify({ objectClassName: "domain" }));
    await expect(rdapCheck("a.com")).resolves.toMatchObject({ status: "taken" });
  });

  it("a 200 that isn't a record says nothing", async () => {
    serverAnswers(200, "application/json", JSON.stringify({ hello: "there" }));
    await expect(rdapCheck("a.com")).resolves.toBeNull();
  });
});

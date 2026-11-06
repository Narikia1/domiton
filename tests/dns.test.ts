import { afterEach, describe, expect, it, vi } from "vitest";
import { dnsCheck } from "../src/core/dns.js";

const SOA = 6;
const NS = 2;

function reply(body: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
}

describe("what public DNS can say", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("calls a name with live name servers taken", async () => {
    reply({ Status: 0, Answer: [{ name: "google.ph", type: NS }] });
    expect(await dnsCheck("google.ph")).toEqual({ status: "taken", source: "dns" });
  });

  it("calls a name that doesn't exist probably free, never free", async () => {
    reply({ Status: 3, Authority: [{ name: "com", type: SOA }] });
    expect(await dnsCheck("zqxv.com")).toEqual({ status: "likely-free", source: "dns" });
  });

  it("reads an empty reply from the ending's own zone the same way, as .ph sends", async () => {
    reply({ Status: 0, Answer: [], Authority: [{ name: "ph", type: SOA }] });
    expect(await dnsCheck("zqxv.ph")).toEqual({ status: "likely-free", source: "dns" });
    reply({ Status: 0, Authority: [{ name: "ph.", type: SOA }] });
    expect(await dnsCheck("zqxv.ph")).toEqual({ status: "likely-free", source: "dns" });
  });

  it("says nothing when the name has its own zone but no name servers came back", async () => {
    reply({ Status: 0, Authority: [{ name: "zqxv.ph", type: SOA }] });
    expect(await dnsCheck("zqxv.ph")).toBeNull();
  });

  it("says nothing when the lookup itself fails", async () => {
    reply({ Status: 2 });
    expect(await dnsCheck("zqxv.ph")).toBeNull();
  });
});

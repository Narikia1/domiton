import { describe, expect, it } from "vitest";
import { readWhois } from "../src/core/whois.js";

/** Replies as the registries really send them. */
const TERMS = `>>> Last update of WHOIS database: 2026-11-06T07:00:32Z <<<

Terms of Use: Access to WHOIS information is provided to assist persons. High-volume queries are prohibited,
and access may be denied or blocked. Registrar: see your agreement. Please try again later if rate limit is exceeded.`;

describe("reading a registry's reply", () => {
  it.each([
    [".io and .me", `Domain not found.\n${TERMS}`],
    [".de", "Domain: zqxv.de\nStatus: free\n"],
    [".eu and .be", "Domain: zqxv.eu\nStatus: AVAILABLE\n"],
    [".nl", "zqxv.nl is free\n"],
    [".co", "No Data Found\n"],
    [".com style", 'No match for "ZQXV.COM".\n'],
    [".ch style", "We do not have an entry in our database matching your query.\n"],
  ])("%s: no record means free", (_, reply) => {
    expect(readWhois(reply)).toBe("free");
  });

  it.each([
    [".io and .me", `This domain is protected by the Registry Lock service.\nDomain Name: google.io\nCreation Date: 2002-10-01T01:00:00Z\nRegistrar: MarkMonitor\n${TERMS}`],
    [".de", "Domain: google.de\nNserver: ns1.google.com\nStatus: connect\n"],
    [".de without name servers", "Domain: google.de\nStatus: connect\n"],
    [".it", "Domain:             google.it\nStatus:             ok\nCreated:            1999-12-10\n"],
  ])("%s: a record means taken", (_, reply) => {
    expect(readWhois(reply)).toBe("taken");
  });

  it.each([
    [".ch refusing this client", "Requests of this client are not permitted. Please use https://www.nic.ch/whois/ for queries.\n"],
    ["a rate limit", "55000000002 Connection refused; access control limit exceeded\n"],
    ["a temporary failure", "Service unavailable, please try again later.\n"],
    ["an empty reply", ""],
    ["only comments", "% This is the WHOIS service\n% Rate limits apply\n"],
    ["something unknown", "Hello.\n"],
  ])("%s says nothing about the name", (_, reply) => {
    expect(readWhois(reply)).toBeNull();
  });

  it("does not read a legal notice as an answer", () => {
    expect(readWhois(`Hello.\n${TERMS}\nThis domain is not found in some cases.`)).toBeNull();
  });
});

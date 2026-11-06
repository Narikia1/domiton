import { describe, expect, it } from "vitest";
import { readDetails, readServer, readWhois } from "../src/core/whois.js";

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
    [".bg", "DOMAIN NAME: zqxv.bg (zqxv.bg)\nregistration status: available\n"],
    [".cn", "No matching record.\n"],
    [".hu", "Nincs talalat / No match\n"],
    [".jp", "[ JPRS database provides information on network administration. Its use is ]\nNo match!!\n"],
    [".lt", "% Hello, this is the DOMREG whois service.\nDomain:\t\t\tzqxv.lt\nStatus:\t\t\tavailable\n"],
    [".mx", "No_Se_Encontro_El_Objeto/Object_Not_Found\n"],
    [".tm", "Domain zqxv.tm is available for purchase\nPlease visit http://www.nic.tm/ for more information\n"],
    [".ir and .ve, in a comment", "% This is the IRNIC Whois server v2.0.0.\n% Information related to 'zqxv.ir'\n%ERROR:101: no entries found\n%\n"],
    [".rs, in a comment", "%ERROR:103: Domain is not registered\n"],
    [".dz, in a comment", "% This is the WHOIS server for Example Registry.\n% Queries are subject to terms of use.\n%\n% No match for domain 'ZQXV.DZ'.\n"],
    [".ga, in a comment", "%% NOT FOUND\n>>> Last update of WHOIS database: 2026-11-06T11:10:32Z <<<\n%% This is the ANINF Whois server.\n"],
    [".at, in a comment", "% Copyright (c)2026 by NIC.AT (3)\n% Restricted rights.\n%\n% nothing found\n"],
    [".iq, .kw and .my, in a notice", ">>> Domain zqxv.my is available for registration\n>>> Please visit https://rdap.mynicregistry.my/registrars/ for a list of\n"],
    [".ug, in a notice", "*** The UG ccTLD Registry Database ***\nDomain Name: zqxv.ug\n>>> Domain not Found\n>>> Last update of WHOIS database: 2026-11-06T11:10:31 <<<\n"],
  ])("%s: no record means free", (_, reply) => {
    expect(readWhois(reply)).toBe("free");
  });

  it.each([
    [".io and .me", `This domain is protected by the Registry Lock service.\nDomain Name: google.io\nCreation Date: 2002-10-01T01:00:00Z\nRegistrar: MarkMonitor\n${TERMS}`],
    [".de", "Domain: google.de\nNserver: ns1.google.com\nStatus: connect\n"],
    [".de without name servers", "Domain: google.de\nStatus: connect\n"],
    [".it", "Domain:             google.it\nStatus:             ok\nCreated:            1999-12-10\n"],
    [".cd", "Domain Name: google.cd\nRegistry Domain ID: 4592-niccd\nRegistrar: Markmonitor\n"],
    [".bg", "DOMAIN NAME: google.bg (google.bg)\nregistration status: busy, active\n"],
    [".bo, in Spanish", "Dominio: google.bo\nTITULAR:\nEmail: dns-admin en google.com\n"],
    [".cn", "Domain Name: google.cn\nROID: 20030311s10001s00033735-cn\nDomain Status: clientDeleteProhibited\n"],
    [".ga, in French", "Domain ID:                     DOM8624-GA\nNom de domaine:                google.ga\nDate de création:              2023-06-06T19:15:12Z\n"],
    [".hu", "domain:         google.hu\nrecord created: 2000-03-03\n"],
    [".jp", "[ JPRS database provides information on network administration. Its use is ]\na. [Domain Name]                GOOGLE.JP\n[Registrant]                    Google LLC\n"],
    [".tm", "Domain : google.tm\nStatus : Client Updt+Delt Lock\nExpiry : 2027-01-30\nNS 1   : ns1.google.com\n"],
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

describe("reading IANA's record for an ending", () => {
  it("finds the server", () => {
    expect(readServer("domain:       DE\nwhois:        whois.denic.de\nstatus:       ACTIVE\n")).toBe("whois.denic.de");
  });

  it("knows an empty line names no server, as .cd has", () => {
    expect(readServer("domain:       CD\nwhois:        \n\nstatus:       ACTIVE\n")).toBeNull();
  });
});

describe("replies that say nothing about the name", () => {
  it.each([
    ["an empty reply", ""],
    ["only legal text", "% Copyright (c)2026 by NIC.AT\n% Restricted rights. No part of this may be reproduced if not found in the database.\n"],
    [".at, over its limit", "% Error: 55000000002 Connection refused; access control limit reached.\n"],
    [".li, refusing this client", "Requests of this client are not permitted. Please use https://www.nic.ch/whois/ for queries.\n"],
    [".bo, refusing the query", "whois.nic.bo solo acepta consultas con dominios .bo\n"],
    [".bw, on a name that can't be registered", "Domain Name: zqxv.bw\nDomain Status: Prohibited String - Domain Cannot Be Registered\nTERMS OF USE: You are NOT authorized\n"],
    [".dm, on a restricted word", "Domain Name: zqxv.dm\n>>> This name is not available for registration:\n>>> Domain name matches a restricted word\n"],
  ])("%s", (_, reply) => {
    expect(readWhois(reply)).toBeNull();
  });
});

describe("reading what a record shares", () => {
  it("finds the registrar and dates, in the wording of .cd", () => {
    expect(
      readDetails("Domain Name: google.cd\nRegistrar WHOIS Server: whois.x\nRegistrar URL: http://x\nCreation Date: 2021-01-15T00:00:00.0Z\nRegistry Expiry Date: 2025-06-30T00:00:00.0Z\nRegistrar: Markmonitor\n"),
    ).toEqual({ registrar: "Markmonitor", registered: "2021-01-15T00:00:00.0Z", expires: "2025-06-30T00:00:00.0Z" });
  });

  it("reads other registries' wording, and leaves the rest out", () => {
    expect(readDetails("Domain:\t\t\tgoogle.lt\nStatus:\t\t\tregistered\nRegistered:\t\t2018-12-07\nExpires:\t\t2026-12-08\n")).toEqual({ registered: "2018-12-07", expires: "2026-12-08" });
    expect(readDetails("registrar:         MarkMonitor Inc. ( https://nic.at/registrar/434 )\n")).toEqual({ registrar: "MarkMonitor Inc." });
    expect(readDetails("Date de création:              2023-06-06T19:15:12Z\n")).toEqual({ registered: "2023-06-06T19:15:12Z" });
    expect(readDetails("Domain: google.de\nStatus: connect\n")).toEqual({});
  });
});

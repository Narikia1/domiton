import { describe, expect, it } from "vitest";
import type { Progress } from "../src/core/findFree.js";
import type { Found } from "../src/core/types.js";
import { answerDetails, problemText, progressText, similarNote, similarTitle } from "../src/ui/text.js";

const found = (over: Partial<Found>): Found => ({ ok: true, status: "free", source: "registry", domain: "a.com", name: "a", ending: "com", similar: [], ...over });
const progress = (over: Partial<Progress>): Progress => ({ free: [], checked: 10, total: 10, unconfirmed: 0, running: false, ...over });

describe("what the app says about an answer", () => {
  it("lists a registration record", () => {
    const details = answerDetails(found({ status: "taken", registered: "2025-03-09T16:59:40Z", expires: "2027-03-09T16:59:40Z", registrar: "A registrar" }));
    expect(details.title).toBe("Registration");
    expect(details.facts.map((fact) => fact.label)).toEqual(["Registered", "Expires", "Registrar"]);
    expect(details.note).toBeNull();
  });

  it("leaves out dates a registry got wrong", () => {
    const details = answerDetails(found({ status: "taken", registered: "not a date", registrar: "A registrar" }));
    expect(details.facts.map((fact) => fact.label)).toEqual(["Registrar"]);
  });

  it("still says something when a record has no details", () => {
    expect(answerDetails(found({ status: "taken" })).note).toBe("The .com registry has a record of this name.");
  });

  it("says when a name is only known to be taken from DNS", () => {
    expect(answerDetails(found({ status: "taken", source: "dns", ending: "es" })).note).toContain("doesn't share more");
  });

  it("warns about prices and reserved names on a free name", () => {
    expect(answerDetails(found({})).note).toContain("premium or reserved");
  });

  it("tells people to confirm a name that is only probably free", () => {
    expect(answerDetails(found({ status: "likely-free", source: "dns", ending: "shop" })).note).toContain("Confirm with a registrar");
  });

  it("admits when nobody answered", () => {
    expect(answerDetails(found({ status: "unknown", source: "none" })).note).toContain("Search again");
  });
});

describe("what the app says about similar names", () => {
  const confirmed = { domain: "a.com", confirmed: true };
  const unconfirmed = { domain: "b.com", confirmed: false };

  it("only says free when the registry confirmed every name", () => {
    expect(similarTitle("com", progress({ free: [confirmed] }))).toBe("Free on .com");
    expect(similarTitle("shop", progress({ free: [unconfirmed] }))).toBe("Free or probably free on .shop");
    expect(similarTitle("de", progress({ free: [confirmed, unconfirmed] }))).toBe("Free or probably free on .de");
  });

  it("counts as it goes and when it has finished", () => {
    expect(progressText(null)).toBe("Checking similar names");
    expect(progressText(progress({ checked: 4, total: 71, running: true }))).toBe("Checking 4 of 71");
    expect(progressText(progress({ free: [confirmed], checked: 15 }))).toBe("1 of 15 tried");
  });

  it("stays quiet while running and when there is nothing to add", () => {
    expect(similarNote("com", progress({ running: true }))).toBeNull();
    expect(similarNote("com", progress({ free: [confirmed] }))).toBeNull();
  });

  it("says when nothing was free", () => {
    expect(similarNote("com", progress({ checked: 71 }))).toBe("None of the 71 similar names is free.");
  });

  it("says when the registry stopped answering", () => {
    expect(similarNote("de", progress({ checked: 8, unconfirmed: 8 }))).toContain("stopped answering");
  });

  it("explains names that rest on DNS, and counts names with no answer", () => {
    expect(similarNote("de", progress({ free: [unconfirmed], unconfirmed: 1 }))).toBe(`The .de registry doesn't answer every lookup, so "Probably free" rests on DNS alone. 1 name got no answer.`);
    expect(similarNote("de", progress({ free: [confirmed], unconfirmed: 3 }))).toBe("3 names got no answer.");
  });
});

describe("problems", () => {
  it("names the ending it can't find", () => {
    expect(problemText({ ok: false, problem: "bad-ending", ending: "xyzq" })).toBe(".xyzq isn't an ending that exists. Check the spelling.");
  });

  it.each(["empty", "bad-name", "too-many", "offline"] as const)("has words for %s", (problem) => {
    expect(problemText({ ok: false, problem }).length).toBeGreaterThan(10);
  });
});

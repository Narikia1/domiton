import { describe, expect, it, vi } from "vitest";
import { checkDomain } from "../src/core/check.js";
import type { Check, Step } from "../src/core/types.js";

const FREE: Check = { status: "free", source: "registry" };
const TAKEN: Check = { status: "taken", source: "registry", registrar: "A registrar" };
const DNS_TAKEN: Check = { status: "taken", source: "dns" };
const NO_DNS: Check = { status: "likely-free", source: "dns" };

const says = (answer: Check | null): Step => async () => answer;
const fails: Step = async () => {
  throw new Error("no connection");
};

describe("deciding what to say about a name", () => {
  it("trusts a registry's record without asking DNS", async () => {
    const dns = vi.fn(says(NO_DNS));
    await expect(checkDomain("a.com", { registry: [says(TAKEN)], dns })).resolves.toEqual(TAKEN);
    expect(dns).not.toHaveBeenCalled();
  });

  it("says free when the registry says so and DNS agrees", async () => {
    await expect(checkDomain("a.com", { registry: [says(FREE)], dns: says(NO_DNS) })).resolves.toEqual(FREE);
  });

  it("lets live name servers overrule a registry that says free", async () => {
    await expect(checkDomain("a.com", { registry: [says(FREE)], dns: says(DNS_TAKEN) })).resolves.toEqual(DNS_TAKEN);
  });

  it("still says free if DNS can't be reached", async () => {
    await expect(checkDomain("a.com", { registry: [says(FREE)], dns: fails })).resolves.toEqual(FREE);
  });

  it("moves to the next registry service when one can't answer", async () => {
    await expect(checkDomain("a.com", { registry: [says(null), says(TAKEN)], dns: says(NO_DNS) })).resolves.toEqual(TAKEN);
    await expect(checkDomain("a.com", { registry: [fails, says(TAKEN)], dns: says(NO_DNS) })).resolves.toEqual(TAKEN);
  });

  it("never says free on DNS alone", async () => {
    const answer = await checkDomain("a.com", { registry: [fails, says(null)], dns: says(NO_DNS) });
    expect(answer).toEqual(NO_DNS);
    expect(answer.status).not.toBe("free");
  });

  it("proves a name is taken from DNS when the registry won't answer", async () => {
    await expect(checkDomain("a.com", { registry: [says(null)], dns: says(DNS_TAKEN) })).resolves.toEqual(DNS_TAKEN);
  });

  it("admits it when nobody answers", async () => {
    await expect(checkDomain("a.com", { registry: [fails, fails], dns: fails })).resolves.toEqual({ status: "unknown", source: "none" });
  });
});

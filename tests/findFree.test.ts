import { describe, expect, it } from "vitest";
import { findFree, type Progress } from "../src/core/findFree.js";
import type { Check, LookupResult } from "../src/core/types.js";
import { SEARCH } from "../src/data/limits.js";

const found = (domain: string, status: Check["status"]): LookupResult => ({
  ok: true,
  status,
  source: status === "free" ? "registry" : "dns",
  domain,
  name: domain.split(".")[0] as string,
  ending: "com",
  similar: [],
});

const names = (count: number) => Array.from({ length: count }, (_, i) => `n${i}.com`);

async function run(candidates: string[], answer: (domain: string, index: number) => LookupResult | Promise<LookupResult>) {
  const reports: Progress[] = [];
  const asked: string[] = [];
  await findFree(
    candidates,
    async (domain) => {
      asked.push(domain);
      return answer(domain, candidates.indexOf(domain));
    },
    (progress) => reports.push(progress),
    () => false,
  );
  return { last: reports.at(-1) as Progress, asked, reports };
}

describe("finding free names", () => {
  it("stops asking once it has enough", async () => {
    const { last, asked } = await run(names(40), (domain) => found(domain, "free"));
    expect(last.free).toHaveLength(SEARCH.target);
    expect(asked.length).toBeLessThan(SEARCH.target + 4);
    expect(last.running).toBe(false);
  });

  it("keeps the closest names first, whatever order the answers arrive in", async () => {
    const candidates = names(4);
    const { last } = await run(candidates, async (domain, index) => {
      await new Promise((resolve) => setTimeout(resolve, (4 - index) * 5));
      return found(domain, "free");
    });
    expect(last.free.map((item) => item.domain)).toEqual(candidates);
  });

  it("leaves out taken names and counts what it tried", async () => {
    const { last } = await run(names(6), (domain, index) => found(domain, index % 2 ? "taken" : "free"));
    expect(last.free.map((item) => item.domain)).toEqual(["n0.com", "n2.com", "n4.com"]);
    expect(last).toMatchObject({ checked: 6, total: 6, unconfirmed: 0 });
  });

  it("marks names that rest on DNS alone", async () => {
    const { last } = await run(names(2), (domain, index) => found(domain, index === 0 ? "free" : "likely-free"));
    expect(last.free).toEqual([
      { domain: "n0.com", confirmed: true },
      { domain: "n1.com", confirmed: false },
    ]);
  });

  it("stops when nobody is answering", async () => {
    const { last, asked } = await run(names(40), (domain) => found(domain, "unknown"));
    expect(asked.length).toBeLessThan(14);
    expect(last.unconfirmed).toBe(last.checked);
    expect(last.running).toBe(false);
  });

  it("keeps going when only some names get no answer", async () => {
    const { last } = await run(names(20), (domain, index) => found(domain, index === 0 ? "free" : "unknown"));
    expect(last.checked).toBe(20);
    expect(last.unconfirmed).toBe(19);
  });

  it("stops and stays quiet once a newer search has started", async () => {
    const reports: Progress[] = [];
    let cancelled = false;
    const asked: string[] = [];
    await findFree(
      names(40),
      async (domain) => {
        asked.push(domain);
        cancelled = true;
        return found(domain, "free");
      },
      (progress) => reports.push(progress),
      () => cancelled,
    );
    expect(asked.length).toBeLessThanOrEqual(4);
    expect(reports).toHaveLength(1);
  });
});

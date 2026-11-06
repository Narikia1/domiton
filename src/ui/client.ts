import type { LookupResult } from "../core/types.js";

declare global {
  interface Window {
    /** Only in the desktop apps, which ask the registries themselves instead of going through a server. */
    domiton?: { platform: string; lookup(query: string): Promise<LookupResult> };
  }
}

export async function lookup(query: string): Promise<LookupResult> {
  try {
    if (window.domiton) return await window.domiton.lookup(query);
    const response = await fetch(`/api/lookup?q=${encodeURIComponent(query)}`);
    return (await response.json()) as LookupResult;
  } catch {
    return { ok: false, problem: "offline" };
  }
}

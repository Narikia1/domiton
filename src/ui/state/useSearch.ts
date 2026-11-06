import { useRef, useState } from "react";
import { findFree, type Progress } from "../../core/findFree.js";
import type { Found, LookupResult } from "../../core/types.js";
import { lookup } from "../client.js";

export interface Search {
  /** What was typed, shown until the answer arrives. */
  query: string;
  /** Null while the first answer is on its way. */
  result: LookupResult | null;
  progress: Progress | null;
}

/** Runs one search at a time. A newer search, or a reset, stops the lookups of the one before. */
export function useSearch() {
  const [search, setSearch] = useState<Search | null>(null);
  const currentRun = useRef(0);

  function reset() {
    currentRun.current++;
    setSearch(null);
  }

  async function run(input: string, onFound: (found: Found) => void) {
    const thisRun = ++currentRun.current;
    const isCancelled = () => thisRun !== currentRun.current;
    const query = input.trim();

    if (!query) {
      setSearch({ query, result: { ok: false, problem: "empty" }, progress: null });
      return;
    }

    setSearch({ query, result: null, progress: null });
    const result = await lookup(query);
    if (isCancelled()) return;

    setSearch({ query, result, progress: null });
    if (result.ok) {
      onFound(result);
      await findFree(result.similar, lookup, (progress) => setSearch({ query, result, progress }), isCancelled);
    }
  }

  return { search, run, reset };
}

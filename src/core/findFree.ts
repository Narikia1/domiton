import { SEARCH } from "../data/limits.js";
import type { LookupResult } from "./types.js";

export interface FreeName {
  domain: string;
  /** False when the registry would not answer and this rests on DNS alone. */
  confirmed: boolean;
}

export interface Progress {
  /** In the order they were suggested, closest first. */
  free: FreeName[];
  checked: number;
  total: number;
  /** Names nobody could answer for. */
  unconfirmed: number;
  running: boolean;
}

/** Works through the suggestions until enough free names are found. */
export async function findFree(
  candidates: string[],
  ask: (domain: string) => Promise<LookupResult>,
  report: (progress: Progress) => void,
  isCancelled: () => boolean,
): Promise<void> {
  const found: { name: FreeName; order: number }[] = [];
  let next = 0;
  let checked = 0;
  let unconfirmed = 0;

  const send = (running: boolean) =>
    report({
      free: [...found].sort((a, b) => a.order - b.order).slice(0, SEARCH.target).map((item) => item.name),
      checked,
      total: candidates.length,
      unconfirmed,
      running,
    });
  const nobodyAnswering = () => checked >= SEARCH.giveUpAfter && unconfirmed === checked;

  const worker = async () => {
    while (!isCancelled() && next < candidates.length && found.length < SEARCH.target && !nobodyAnswering()) {
      const order = next++;
      const result = await ask(candidates[order] as string);
      if (isCancelled()) return;
      checked++;
      if (!result.ok || result.status === "unknown") unconfirmed++;
      else if (result.status !== "taken") found.push({ name: { domain: result.domain, confirmed: result.status === "free" }, order });
      send(true);
    }
  };

  send(true);
  await Promise.all(Array.from({ length: SEARCH.atOnce }, worker));
  if (!isCancelled()) send(false);
}

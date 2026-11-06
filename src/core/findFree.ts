import type { LookupResult } from "./types.js";

/** How many free names a search looks for. Only names that are hard to find free use all the suggestions. */
export const TARGET = 12;
/** Registries limit how fast they answer, so only a few names are asked about at once. */
const AT_ONCE = 4;
/** After this many names with no answer at all, nobody is answering this search. */
const GIVE_UP_AFTER = 8;

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
      free: [...found].sort((a, b) => a.order - b.order).slice(0, TARGET).map((item) => item.name),
      checked,
      total: candidates.length,
      unconfirmed,
      running,
    });
  const nobodyAnswering = () => checked >= GIVE_UP_AFTER && unconfirmed === checked;

  const worker = async () => {
    while (!isCancelled() && next < candidates.length && found.length < TARGET && !nobodyAnswering()) {
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
  await Promise.all(Array.from({ length: AT_ONCE }, worker));
  if (!isCancelled()) send(false);
}

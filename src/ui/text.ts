import type { Progress } from "../core/findFree.js";
import type { Found, Refused } from "../core/types.js";
import type { Tone } from "./atoms/Status.js";
import type { CopyState } from "./state/useCopy.js";

/** Every word the app shows, in one place. */
export const TEXT = {
  appName: "Domiton",
  endorsement: "BY NARIKIA",
  familyName: "DotGo",
  familyLine: "A Narikia app in the DotGo family",
  searchLabel: "Domain name",
  searchPlaceholder: "yourname.com",
  searchSubmit: "Search",
  idleTitle: "Find your domain",
  idleLead: "See if a name is free, and get similar free names on the same ending. If you leave the ending out, Domiton uses .com.",
  checking: "Checking",
  visit: "Visit site",
  newSearch: "New search",
  guideTitle: "What the answers mean",
} as const;

type Status = Found["status"];

export const STATUS_WORD: Record<Status, string> = { free: "Free", taken: "Taken", "likely-free": "Probably free", unknown: "Can't tell" };
export const STATUS_TONE: Record<Status, Tone> = { free: "success", taken: "danger", "likely-free": "warning", unknown: "neutral" };

export const GUIDE: { status: Status; meaning: string }[] = [
  { status: "free", meaning: "The registry has no record of this name." },
  { status: "likely-free", meaning: "The registry doesn't answer lookups, but the name has no DNS. Confirm with a registrar." },
  { status: "taken", meaning: "The registry has a record, or the name has live DNS." },
];

export function copyLabel(state: CopyState): string {
  return { idle: "Copy", copied: "Copied", failed: "Can't copy" }[state];
}

function date(iso: string): string | null {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export interface AnswerDetails {
  title: string;
  facts: { label: string; value: string }[];
  note: string | null;
}

/** The panel under the answer: the registration record if there is one, or else why the answer is what it is. */
export function answerDetails(found: Found): AnswerDetails {
  const registry = `.${found.ending} registry`;
  const about = (note: string): AnswerDetails => ({ title: "About this answer", facts: [], note });

  switch (found.status) {
    case "free":
      return about(`The ${registry} has no record of this name. A registrar sets the final price, and some names are premium or reserved.`);
    case "likely-free":
      return about(`The ${registry} doesn't answer public lookups, but this name has no DNS at all. Confirm with a registrar before you count on it.`);
    case "unknown":
      return about(`Neither the ${registry} nor public DNS answered. Search again in a minute.`);
    case "taken": {
      if (found.source === "dns") return about(`It has live name servers, so someone holds it. The ${registry} doesn't share more.`);
      const registered = found.registered && date(found.registered);
      const expires = found.expires && date(found.expires);
      const facts = [
        ...(registered ? [{ label: "Registered", value: registered }] : []),
        ...(expires ? [{ label: "Expires", value: expires }] : []),
        ...(found.registrar ? [{ label: "Registrar", value: found.registrar }] : []),
      ];
      return facts.length > 0 ? { title: "Registration", facts, note: null } : about(`The ${registry} has a record of this name.`);
    }
  }
}

/** "Free" is only ever said about what a registry confirmed, in the title as well as on each row. */
export function similarTitle(ending: string, progress: Progress | null): string {
  return progress?.free.some((item) => !item.confirmed) ? `Free or probably free on .${ending}` : `Free on .${ending}`;
}

export function progressText(progress: Progress | null): string {
  if (!progress) return "Checking similar names";
  const { free, checked, total, running } = progress;
  return running ? `Checking ${checked} of ${total}` : `${free.length} of ${checked} tried`;
}

/** What to say under the list when the search has more to explain. */
export function similarNote(ending: string, progress: Progress): string | null {
  const { free, checked, unconfirmed, running } = progress;
  if (running) return null;
  if (checked > 0 && unconfirmed === checked) return `The .${ending} registry stopped answering, so this search stopped. Try again in a minute.`;

  const lines = [
    ...(free.length === 0 ? [`None of the ${checked} similar names is free.`] : []),
    ...(free.some((item) => !item.confirmed) ? [`The .${ending} registry doesn't answer every lookup, so "Probably free" rests on DNS alone.`] : []),
    ...(unconfirmed > 0 ? [`${unconfirmed} ${unconfirmed === 1 ? "name" : "names"} got no answer.`] : []),
  ];
  return lines.length > 0 ? lines.join(" ") : null;
}

export function problemText(refused: Refused): string {
  switch (refused.problem) {
    case "empty":
      return "Type a name first.";
    case "bad-name":
      return "A name can use letters, numbers and hyphens, and can't start or end with a hyphen.";
    case "bad-ending":
      return `.${refused.ending ?? ""} isn't an ending that exists. Check the spelling.`;
    case "too-many":
      return "That's too many searches in a minute. Wait a moment and search again.";
    case "offline":
      return "Can't reach the lookup service. Check your connection and search again.";
  }
}

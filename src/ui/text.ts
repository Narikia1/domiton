import type { Progress } from "../core/findFree.js";
import type { Found, Refused } from "../core/types.js";
import type { Tone } from "./atoms/Status.js";
import type { MessageKey, Translator } from "./i18n/messages.js";
import type { CopyState } from "./state/useCopy.js";

/** What the app says about a result. The words themselves live in the i18n catalogues. */
type Status = Found["status"];

const STATUS_WORD: Record<Status, MessageKey> = { free: "status.free", taken: "status.taken", "likely-free": "status.likelyFree", unknown: "status.unknown" };
export const STATUS_TONE: Record<Status, Tone> = { free: "success", taken: "danger", "likely-free": "warning", unknown: "neutral" };

export function statusWord({ t }: Translator, status: Status): string {
  return t(STATUS_WORD[status]);
}

export const GUIDE: { status: Status; meaning: MessageKey }[] = [
  { status: "free", meaning: "guide.free" },
  { status: "likely-free", meaning: "guide.likelyFree" },
  { status: "taken", meaning: "guide.taken" },
];

export function copyLabel({ t }: Translator, state: CopyState): string {
  return t(({ idle: "copy.idle", copied: "copy.copied", failed: "copy.failed" } as const)[state]);
}

export interface AnswerDetails {
  title: string;
  facts: { label: string; value: string }[];
  note: string | null;
}

/** The panel under the answer: the registration record if there is one, or else why the answer is what it is. */
export function answerDetails(i18n: Translator, found: Found): AnswerDetails {
  const { t, date } = i18n;
  const { ending } = found;
  const about = (note: string): AnswerDetails => ({ title: t("answer.about"), facts: [], note });

  switch (found.status) {
    case "free":
      return about(t("answer.free", { ending }));
    case "likely-free":
      return about(t("answer.likelyFree", { ending }));
    case "unknown":
      return about(t("answer.unknown", { ending }));
    case "taken": {
      if (found.source === "dns") return about(t("answer.takenDns", { ending }));
      const registered = found.registered && date(found.registered);
      const expires = found.expires && date(found.expires);
      const facts = [
        ...(registered ? [{ label: t("fact.registered"), value: registered }] : []),
        ...(expires ? [{ label: t("fact.expires"), value: expires }] : []),
        ...(found.registrar ? [{ label: t("fact.registrar"), value: found.registrar }] : []),
      ];
      return facts.length > 0 ? { title: t("answer.registration"), facts, note: null } : about(t("answer.takenRecord", { ending }));
    }
  }
}

/** "Free" is only ever said about what a registry confirmed, in the title as well as on each row. */
export function similarTitle({ t }: Translator, ending: string, progress: Progress | null): string {
  return t(progress?.free.some((item) => !item.confirmed) ? "similar.titleMixed" : "similar.title", { ending });
}

export function progressText({ t }: Translator, progress: Progress | null): string {
  if (!progress) return t("similar.starting");
  const { free, checked, total, running } = progress;
  return running ? t("similar.running", { checked, total }) : t("similar.done", { free: free.length, checked });
}

/** What to say under the list when the search has more to explain. */
export function similarNote({ t }: Translator, ending: string, progress: Progress): string | null {
  const { free, checked, unconfirmed, running } = progress;
  if (running) return null;
  if (checked > 0 && unconfirmed === checked) return t("similar.stopped", { ending });

  const lines = [
    ...(free.length === 0 ? [t("similar.none", { checked })] : []),
    ...(free.some((item) => !item.confirmed) ? [t("similar.unconfirmed", { ending })] : []),
    ...(unconfirmed > 0 ? [unconfirmed === 1 ? t("similar.noAnswerOne") : t("similar.noAnswerMany", { count: unconfirmed })] : []),
  ];
  return lines.length > 0 ? lines.join(" ") : null;
}

export function problemText({ t }: Translator, refused: Refused): string {
  switch (refused.problem) {
    case "empty":
      return t("problem.empty");
    case "bad-name":
      return t("problem.badName");
    case "bad-ending":
      return t("problem.badEnding", { ending: refused.ending ?? "" });
    case "too-many":
      return t("problem.tooMany");
    case "offline":
      return t("problem.offline");
  }
}

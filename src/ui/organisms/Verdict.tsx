import type { CSSProperties } from "react";
import type { Found } from "../../core/types.js";
import { StatusBadge } from "../atoms/Status.js";
import { ActionButton } from "../molecules/ActionButton.js";
import { useCopy } from "../state/useCopy.js";
import { copyLabel, STATUS_TONE, STATUS_WORD, TEXT } from "../text.js";

/** The heading of the page: the domain itself, as large as it fits, with its ending smaller. */
function BigName({ name, ending }: { name: string; ending?: string }) {
  const letters = name.length + (ending ? ending.length + 1 : 0);
  return (
    <h1 className="big-name type-display" style={{ "--letters": letters } as CSSProperties}>
      {name}
      {ending && <span className="big-name-ending">.{ending}</span>}
    </h1>
  );
}

export function VerdictIdle() {
  return (
    <div className="verdict">
      <h1 className="verdict-title type-heading-1">{TEXT.idleTitle}</h1>
      <p className="verdict-lead type-body-lg">{TEXT.idleLead}</p>
    </div>
  );
}

export function VerdictChecking({ query }: { query: string }) {
  return (
    <div className="verdict" role="status">
      <BigName name={query} />
      <StatusBadge tone="neutral" label={TEXT.checking} busy />
    </div>
  );
}

export function VerdictAnswer({ found, onNewSearch }: { found: Found; onNewSearch: () => void }) {
  const { state, copy } = useCopy(found.domain);
  return (
    <div className="verdict">
      <div className="verdict-answer" role="status">
        <BigName name={found.name} ending={found.ending} />
        <StatusBadge tone={STATUS_TONE[found.status]} label={STATUS_WORD[found.status]} />
      </div>
      <div className="verdict-actions">
        <ActionButton icon={state === "copied" ? "check" : state === "failed" ? "alert" : "copy"} label={copyLabel(state)} onClick={() => void copy()} />
        {found.status === "taken" && <ActionButton icon="external" label={TEXT.visit} href={`https://${found.domain}`} />}
        <ActionButton icon="reset" label={TEXT.newSearch} onClick={onNewSearch} />
      </div>
    </div>
  );
}

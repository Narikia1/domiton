import type { CSSProperties } from "react";
import type { Found } from "../../core/types.js";
import { StatusBadge } from "../atoms/Status.js";
import { useI18n } from "../i18n/I18nProvider.js";
import { ActionButton } from "../molecules/ActionButton.js";
import { useCopy } from "../state/useCopy.js";
import { copyLabel, STATUS_TONE, statusWord } from "../text.js";

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
  const { t } = useI18n();
  return (
    <div className="verdict">
      <h1 className="verdict-title type-heading-1">{t("idle.title")}</h1>
      <p className="verdict-lead type-body-lg">{t("idle.lead")}</p>
    </div>
  );
}

export function VerdictChecking({ query }: { query: string }) {
  const { t } = useI18n();
  return (
    <div className="verdict" role="status">
      <BigName name={query} />
      <StatusBadge tone="neutral" label={t("checking")} busy />
    </div>
  );
}

interface VerdictAnswerProps {
  found: Found;
  /** Where to get this name, when it's free and Hostinger sells its ending. */
  getLink: string | null;
  onNewSearch: () => void;
}

export function VerdictAnswer({ found, getLink, onNewSearch }: VerdictAnswerProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const { state, copy } = useCopy(found.domain);
  const canGet = found.status === "free" || found.status === "likely-free";
  return (
    <div className="verdict">
      <div className="verdict-answer" role="status">
        <BigName name={found.name} ending={found.ending} />
        <StatusBadge tone={STATUS_TONE[found.status]} label={statusWord(i18n, found.status)} />
      </div>
      <div className="verdict-actions">
        {canGet && getLink && <ActionButton icon="bag" label={t("action.get")} href={getLink} sponsored />}
        <ActionButton icon={state === "copied" ? "check" : state === "failed" ? "alert" : "copy"} label={copyLabel(i18n, state)} onClick={() => void copy()} />
        {found.status === "taken" && <ActionButton icon="external" label={t("action.visit")} href={`https://${found.domain}`} />}
        <ActionButton icon="reset" label={t("action.newSearch")} onClick={onNewSearch} />
      </div>
    </div>
  );
}

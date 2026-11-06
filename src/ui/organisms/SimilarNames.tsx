import type { FreeName, Progress } from "../../core/findFree.js";
import { Avatar } from "../atoms/Avatar.js";
import { Button, ButtonLink } from "../atoms/Button.js";
import { StatusDot } from "../atoms/Status.js";
import { useI18n } from "../i18n/I18nProvider.js";
import { ListRow } from "../molecules/ListRow.js";
import { Panel } from "../molecules/Panel.js";
import { SkeletonRow } from "../molecules/SkeletonRow.js";
import { useCopy } from "../state/useCopy.js";
import { copyLabel, progressText, similarNote, similarTitle, STATUS_TONE, statusWord } from "../text.js";

function NameRow({ item, getLink }: { item: FreeName; getLink: string | null }) {
  const i18n = useI18n();
  const { t } = i18n;
  const { state, copy } = useCopy(item.domain);
  const status = item.confirmed ? "free" : "likely-free";
  const copyWord = copyLabel(i18n, state);
  return (
    <ListRow
      leading={<Avatar text={item.domain} />}
      title={item.domain}
      subtitle={
        <>
          <StatusDot tone={STATUS_TONE[status]} />
          {statusWord(i18n, status)}
        </>
      }
      trailing={
        <span className="row-actions">
          {getLink && (
            <ButtonLink variant="secondary" href={getLink} target="_blank" rel="sponsored noreferrer" aria-label={t("action.getNamed", { domain: item.domain })}>
              {t("action.get")}
            </ButtonLink>
          )}
          <Button variant="secondary" aria-label={t("action.copyNamed", { action: copyWord, domain: item.domain })} onClick={() => void copy()}>
            {copyWord}
          </Button>
        </span>
      }
    />
  );
}

interface SimilarNamesProps {
  ending: string;
  progress: Progress | null;
  /** Where to get these names, when Hostinger sells their ending. */
  getLink: string | null;
}

export function SimilarNames({ ending, progress, getLink }: SimilarNamesProps) {
  const i18n = useI18n();
  const stillLooking = !progress || progress.running;
  const note = progress && similarNote(i18n, ending, progress);
  return (
    <Panel title={similarTitle(i18n, ending, progress)} aside={progressText(i18n, progress)}>
      <ul>
        {progress?.free.map((item) => (
          <NameRow key={item.domain} item={item} getLink={getLink} />
        ))}
        {stillLooking && <SkeletonRow />}
      </ul>
      {note && <p className="panel-note type-body-sm">{note}</p>}
    </Panel>
  );
}

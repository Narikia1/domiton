import type { FreeName, Progress } from "../../core/findFree.js";
import { Avatar } from "../atoms/Avatar.js";
import { Button } from "../atoms/Button.js";
import { StatusDot } from "../atoms/Status.js";
import { ListRow } from "../molecules/ListRow.js";
import { Panel } from "../molecules/Panel.js";
import { SkeletonRow } from "../molecules/SkeletonRow.js";
import { useCopy } from "../state/useCopy.js";
import { copyLabel, progressText, similarNote, similarTitle, STATUS_TONE, STATUS_WORD } from "../text.js";

function NameRow({ item }: { item: FreeName }) {
  const { state, copy } = useCopy(item.domain);
  const status = item.confirmed ? "free" : "likely-free";
  return (
    <ListRow
      leading={<Avatar text={item.domain} />}
      title={item.domain}
      subtitle={
        <>
          <StatusDot tone={STATUS_TONE[status]} />
          {STATUS_WORD[status]}
        </>
      }
      trailing={
        <Button variant="secondary" aria-label={`${copyLabel(state)} ${item.domain}`} onClick={() => void copy()}>
          {copyLabel(state)}
        </Button>
      }
    />
  );
}

export function SimilarNames({ ending, progress }: { ending: string; progress: Progress | null }) {
  const stillLooking = !progress || progress.running;
  const note = progress && similarNote(ending, progress);
  return (
    <Panel title={similarTitle(ending, progress)} aside={progressText(progress)}>
      <ul>
        {progress?.free.map((item) => (
          <NameRow key={item.domain} item={item} />
        ))}
        {stillLooking && <SkeletonRow />}
      </ul>
      {note && <p className="panel-note type-body-sm">{note}</p>}
    </Panel>
  );
}

import { StatusDot } from "../atoms/Status.js";
import { ListRow } from "../molecules/ListRow.js";
import { Panel } from "../molecules/Panel.js";
import { GUIDE, STATUS_TONE, STATUS_WORD, TEXT } from "../text.js";

export function AnswersGuide() {
  return (
    <Panel title={TEXT.guideTitle}>
      <ul>
        {GUIDE.map(({ status, meaning }) => (
          <ListRow key={status} leading={<StatusDot tone={STATUS_TONE[status]} />} title={STATUS_WORD[status]} subtitle={meaning} />
        ))}
      </ul>
    </Panel>
  );
}

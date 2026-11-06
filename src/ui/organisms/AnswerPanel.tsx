import type { Found } from "../../core/types.js";
import { ListRow } from "../molecules/ListRow.js";
import { Panel } from "../molecules/Panel.js";
import { answerDetails } from "../text.js";

export function AnswerPanel({ found }: { found: Found }) {
  const { title, facts, note } = answerDetails(found);
  return (
    <Panel title={title}>
      {facts.length > 0 && (
        <ul>
          {facts.map((fact) => (
            <ListRow key={fact.label} kind="fact" title={fact.label} trailing={<span className="fact-value type-body-md">{fact.value}</span>} />
          ))}
        </ul>
      )}
      {note && <p className="panel-note type-body-md">{note}</p>}
    </Panel>
  );
}

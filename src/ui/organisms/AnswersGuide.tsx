import { StatusDot } from "../atoms/Status.js";
import { useI18n } from "../i18n/I18nProvider.js";
import { ListRow } from "../molecules/ListRow.js";
import { Panel } from "../molecules/Panel.js";
import { GUIDE, STATUS_TONE, statusWord } from "../text.js";

export function AnswersGuide() {
  const i18n = useI18n();
  return (
    <Panel title={i18n.t("guide.title")}>
      <ul>
        {GUIDE.map(({ status, meaning }) => (
          <ListRow key={status} leading={<StatusDot tone={STATUS_TONE[status]} />} title={statusWord(i18n, status)} subtitle={i18n.t(meaning)} />
        ))}
      </ul>
    </Panel>
  );
}

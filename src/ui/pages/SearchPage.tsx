import { useRef, useState } from "react";
import { SearchField } from "../molecules/SearchField.js";
import { AnswerPanel } from "../organisms/AnswerPanel.js";
import { AnswersGuide } from "../organisms/AnswersGuide.js";
import { AppFooter } from "../organisms/AppFooter.js";
import { AppHeader } from "../organisms/AppHeader.js";
import { ProblemNotice } from "../organisms/ProblemNotice.js";
import { SimilarNames } from "../organisms/SimilarNames.js";
import { VerdictAnswer, VerdictChecking, VerdictIdle } from "../organisms/Verdict.js";
import { useSearch } from "../state/useSearch.js";
import { AppShell, type Wash } from "../templates/AppShell.js";
import { problemText, TEXT } from "../text.js";

export function SearchPage() {
  const [text, setText] = useState("");
  const field = useRef<HTMLInputElement>(null);
  const { search, run, reset } = useSearch();

  const result = search?.result ?? null;
  const found = result?.ok ? result : null;
  const problem = result && !result.ok ? result : null;
  const checking = search !== null && result === null;
  const wash: Wash = found?.status === "free" ? "success" : "brand";

  function submit() {
    void run(text, (answer) => setText(answer.domain));
    field.current?.focus();
  }

  function startOver() {
    reset();
    setText("");
    field.current?.focus();
  }

  return (
    <AppShell wash={wash} header={<AppHeader />} footer={<AppFooter />}>
      <SearchField
        label={TEXT.searchLabel}
        placeholder={TEXT.searchPlaceholder}
        submitLabel={TEXT.searchSubmit}
        value={text}
        inputRef={field}
        invalid={problem !== null}
        onChange={setText}
        onSubmit={submit}
      />
      {problem && <ProblemNotice message={problemText(problem)} />}

      {checking && <VerdictChecking query={search.query} />}
      {found && <VerdictAnswer key={found.domain} found={found} onNewSearch={startOver} />}
      {!checking && !found && <VerdictIdle />}

      {found ? (
        <>
          <AnswerPanel found={found} />
          <SimilarNames ending={found.ending} progress={search?.progress ?? null} />
        </>
      ) : (
        !checking && <AnswersGuide />
      )}
    </AppShell>
  );
}

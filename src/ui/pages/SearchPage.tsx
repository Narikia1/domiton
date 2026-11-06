import { useRef, useState } from "react";
import { hostingerLink } from "../../data/hostinger.js";
import { useI18n } from "../i18n/I18nProvider.js";
import { SearchField } from "../molecules/SearchField.js";
import { AffiliateNote } from "../organisms/AffiliateNote.js";
import { AnswerPanel } from "../organisms/AnswerPanel.js";
import { AnswersGuide } from "../organisms/AnswersGuide.js";
import { AppFooter } from "../organisms/AppFooter.js";
import { AppHeader } from "../organisms/AppHeader.js";
import { ProblemNotice } from "../organisms/ProblemNotice.js";
import { SimilarNames } from "../organisms/SimilarNames.js";
import { VerdictAnswer, VerdictChecking, VerdictIdle } from "../organisms/Verdict.js";
import { useSearch } from "../state/useSearch.js";
import { AppShell, type Wash } from "../templates/AppShell.js";
import { problemText } from "../text.js";

export function SearchPage() {
  const i18n = useI18n();
  const { t, locale } = i18n;
  const [text, setText] = useState("");
  const field = useRef<HTMLInputElement>(null);
  const { search, run, reset } = useSearch();

  const result = search?.result ?? null;
  const found = result?.ok ? result : null;
  const problem = result && !result.ok ? result : null;
  const checking = search !== null && result === null;
  const wash: Wash = found?.status === "free" ? "success" : "brand";
  const getLink = found ? hostingerLink(found.ending, locale) : null;

  function submit() {
    void run(text, locale, (answer) => setText(answer.domain));
    field.current?.focus();
  }

  function startOver() {
    reset();
    setText("");
    field.current?.focus();
  }

  return (
    <AppShell
      wash={wash}
      header={<AppHeader />}
      footer={<AppFooter />}
      lead={!checking && !found ? <VerdictIdle /> : undefined}
      search={
        <SearchField
          label={t("search.label")}
          placeholder={t("search.placeholder")}
          submitLabel={t("search.submit")}
          value={text}
          inputRef={field}
          invalid={problem !== null}
          onChange={setText}
          onSubmit={submit}
        />
      }
    >
      {problem && <ProblemNotice message={problemText(i18n, problem)} />}

      {checking && <VerdictChecking query={search.query} />}
      {found && <VerdictAnswer key={found.domain} found={found} getLink={getLink} onNewSearch={startOver} />}

      {found ? (
        <>
          <AnswerPanel found={found} />
          <SimilarNames ending={found.ending} progress={search?.progress ?? null} getLink={getLink} />
          {getLink && <AffiliateNote />}
        </>
      ) : (
        !checking && <AnswersGuide />
      )}
    </AppShell>
  );
}

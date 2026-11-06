import { BRAND } from "../../data/brand.js";
import { LOCALE_NAMES, LOCALES, type Locale } from "../../data/locales.js";
import { useI18n } from "../i18n/I18nProvider.js";
import { LanguageSelect } from "../molecules/LanguageSelect.js";

const LANGUAGES = LOCALES.map((code: Locale) => ({ code, name: LOCALE_NAMES[code] }));

/** The logo always reads: the mark, the name, then the endorsement under the name. */
export function AppHeader() {
  const { t, locale, setLocale } = useI18n();
  return (
    <header className="app-header">
      <span className="app-identity">
        <img className="app-mark" src="./icon.svg" alt="" />
        <span className="app-name">
          <span className="type-heading-5">{BRAND.name}</span>
          <span className="app-endorsement type-eyebrow">{BRAND.endorsement}</span>
        </span>
      </span>
      <LanguageSelect label={t("language.label")} options={LANGUAGES} value={locale} onChange={setLocale} />
    </header>
  );
}

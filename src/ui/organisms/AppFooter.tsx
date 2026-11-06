import { LOCALE_NAMES, LOCALES, type Locale } from "../../data/locales.js";
import { useI18n } from "../i18n/I18nProvider.js";
import { LanguageSwitch } from "../molecules/LanguageSwitch.js";

const LANGUAGES = LOCALES.map((code: Locale) => ({ code, name: LOCALE_NAMES[code] }));

export function AppFooter() {
  const { t, locale, setLocale } = useI18n();
  return (
    <footer className="app-footer type-caption">
      <LanguageSwitch label={t("language.label")} options={LANGUAGES} value={locale} onChange={setLocale} />
      <span className="app-footer-family">
        <img className="narikia-logo" src="./brand/narikia.svg" alt="" />
        <span>{t("family.line")}</span>
      </span>
    </footer>
  );
}

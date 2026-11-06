import { useI18n } from "../i18n/I18nProvider.js";

export function AppFooter() {
  const { t } = useI18n();
  return (
    <footer className="app-footer type-caption">
      <img className="narikia-logo" src="./brand/narikia.svg" alt="" />
      <span>{t("company.line")}</span>
    </footer>
  );
}

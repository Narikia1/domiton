import { useI18n } from "../i18n/I18nProvider.js";

/** Says plainly that the button is an affiliate link. It appears wherever the button does. */
export function AffiliateNote() {
  const { t } = useI18n();
  return <p className="affiliate-note type-caption">{t("affiliate.note")}</p>;
}

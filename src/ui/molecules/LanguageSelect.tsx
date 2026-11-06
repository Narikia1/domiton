import { Icon } from "../atoms/Icon.js";

interface LanguageSelectProps<Code extends string> {
  label: string;
  options: readonly { code: Code; name: string }[];
  value: Code;
  onChange: (code: Code) => void;
}

/** Each language is named in itself and marked as such, so a screen reader pronounces it properly. */
export function LanguageSelect<Code extends string>({ label, options, value, onChange }: LanguageSelectProps<Code>) {
  return (
    <span className="language-select">
      <select className="type-label-sm" aria-label={label} value={value} onChange={(event) => onChange(event.target.value as Code)}>
        {options.map(({ code, name }) => (
          <option key={code} lang={code} value={code}>
            {name}
          </option>
        ))}
      </select>
      <Icon name="chevron" />
    </span>
  );
}

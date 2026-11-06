interface LanguageSwitchProps<Code extends string> {
  label: string;
  options: readonly { code: Code; name: string }[];
  value: Code;
  onChange: (code: Code) => void;
}

/** Each language is named in itself and marked as such, so a screen reader pronounces it properly. */
export function LanguageSwitch<Code extends string>({ label, options, value, onChange }: LanguageSwitchProps<Code>) {
  return (
    <div className="language-switch" role="group" aria-label={label}>
      {options.map(({ code, name }) => (
        <button key={code} className="language-option type-caption" type="button" lang={code} aria-pressed={code === value} onClick={() => onChange(code)}>
          {name}
        </button>
      ))}
    </div>
  );
}

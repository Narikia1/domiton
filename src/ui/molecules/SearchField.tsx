import type { FormEvent, RefObject } from "react";
import { Button } from "../atoms/Button.js";
import { Icon } from "../atoms/Icon.js";

interface SearchFieldProps {
  label: string;
  placeholder: string;
  submitLabel: string;
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  invalid: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function SearchField({ label, placeholder, submitLabel, value, inputRef, invalid, onChange, onSubmit }: SearchFieldProps) {
  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="search" role="search" onSubmit={submit}>
      <span className="search-icon">
        <Icon name="search" />
      </span>
      <label className="sr-only" htmlFor="search">
        {label}
      </label>
      <input
        ref={inputRef}
        id="search"
        className="search-input type-body-md"
        value={value}
        placeholder={placeholder}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
        autoFocus
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
      <Button type="submit" variant="primary" iconOnly aria-label={submitLabel}>
        <Icon name="arrow" />
      </Button>
    </form>
  );
}

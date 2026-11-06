import type { ReactNode } from "react";

interface ListRowProps {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  /** A fact is a quiet label with its value on the right. An item is a thing in a list. */
  kind?: "item" | "fact";
}

export function ListRow({ leading, title, subtitle, trailing, kind = "item" }: ListRowProps) {
  return (
    <li className={`list-row list-row-${kind}`}>
      {leading}
      <span className="list-row-text">
        <span className="list-row-title type-body-md">{title}</span>
        {subtitle && <span className="list-row-subtitle type-body-sm">{subtitle}</span>}
      </span>
      {trailing}
    </li>
  );
}

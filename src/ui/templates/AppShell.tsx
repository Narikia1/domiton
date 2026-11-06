import type { ReactNode } from "react";

export type Wash = "brand" | "success";

const WASHES: Wash[] = ["brand", "success"];

interface AppShellProps {
  /** The colour glowing from the top of the page. */
  wash: Wash;
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

/** The one layout in the app: a soft colour wash, and a centred column of cards on top of it. */
export function AppShell({ wash, header, footer, children }: AppShellProps) {
  return (
    <div className="shell">
      {WASHES.map((name) => (
        <div key={name} className={`shell-wash shell-wash-${name}`} data-active={name === wash} aria-hidden="true" />
      ))}
      <div className="shell-drag" aria-hidden="true" />
      <div className="shell-column">
        {header}
        <main className="shell-main">{children}</main>
        {footer}
      </div>
    </div>
  );
}

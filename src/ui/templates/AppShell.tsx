import type { ReactNode } from "react";

export type Wash = "brand" | "success";

const WASHES: Wash[] = ["brand", "success"];

interface AppShellProps {
  /** The colour glowing from the top of the page. */
  wash: Wash;
  header: ReactNode;
  footer: ReactNode;
  /** What the first screen shows above the search. With it, the search sits in the middle of the window. */
  lead?: ReactNode;
  search: ReactNode;
  children: ReactNode;
}

/** The one layout in the app: a soft colour wash, and a centred column of cards on top of it. */
export function AppShell({ wash, header, footer, lead, search, children }: AppShellProps) {
  return (
    <div className="shell">
      {WASHES.map((name) => (
        <div key={name} className={`shell-wash shell-wash-${name}`} data-active={name === wash} aria-hidden="true" />
      ))}
      <div className="shell-drag" aria-hidden="true" />
      <div className="shell-column">
        {header}
        <main className="shell-main" data-centred={lead !== undefined}>
          {lead && <div className="shell-lead">{lead}</div>}
          {search}
          <div className="shell-rest">{children}</div>
        </main>
        {footer}
      </div>
    </div>
  );
}

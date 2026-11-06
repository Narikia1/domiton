import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  /** Short and changing, such as a count. Screen readers announce it. */
  aside?: string;
  children: ReactNode;
}

/** The rounded card that holds a list. Every panel has the same tone, as the Narikia brand requires. */
export function Panel({ title, aside, children }: PanelProps) {
  return (
    <section className="panel" aria-label={title}>
      <div className="panel-head">
        <h2 className="type-heading-5">{title}</h2>
        {aside && (
          <p className="panel-aside type-body-sm" role="status">
            {aside}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

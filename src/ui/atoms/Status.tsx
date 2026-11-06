export type Tone = "success" | "danger" | "warning" | "neutral";

/** The large pill that gives the answer. Its text is large on purpose: green and red only reach AA contrast at this size. */
export function StatusBadge({ tone, label, busy = false }: { tone: Tone; label: string; busy?: boolean }) {
  return (
    <span className={`status-badge type-heading-5 status-${tone}`} data-busy={busy}>
      {label}
    </span>
  );
}

/** A small marker beside words that already say the same thing. */
export function StatusDot({ tone }: { tone: Tone }) {
  return <span className={`status-dot status-${tone}`} aria-hidden="true" />;
}

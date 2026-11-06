/** The round first letter that starts a list row. */
export function Avatar({ text }: { text: string }) {
  return (
    <span className="avatar type-heading-5" aria-hidden="true">
      {text.slice(0, 1).toUpperCase()}
    </span>
  );
}

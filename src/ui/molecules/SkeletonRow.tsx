/** Holds the place of a row that is still being looked for. */
export function SkeletonRow() {
  return (
    <li className="list-row list-row-skeleton" aria-hidden="true">
      <span className="skeleton skeleton-circle" />
      <span className="list-row-text">
        <span className="skeleton skeleton-title" />
        <span className="skeleton skeleton-subtitle" />
      </span>
    </li>
  );
}

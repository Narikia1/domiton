export type IconName = "search" | "arrow" | "copy" | "check" | "alert" | "external" | "reset" | "bag" | "chevron";

const PATHS: Record<IconName, string> = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  check: "m5 12 5 5L20 7",
  alert: "M12 8v5m0 3.5v.5M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z",
  external: "M14 4h6v6m0-6L10 14M18 14v6H4V6h6",
  reset: "M4 12a8 8 0 1 0 2.6-5.9L4 8.5M4 4v4.5h4.5",
  bag: "M6 8h12l1 12H5L6 8Zm3 0V7a3 3 0 0 1 6 0v1",
  chevron: "m6 9 6 6 6-6",
};

/** Decorative by default: the control around an icon carries the name people hear. */
export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

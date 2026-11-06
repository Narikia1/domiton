import { BRAND } from "../../data/brand.js";

/** The logo always reads: the mark, the name, then the endorsement under the name. */
export function AppHeader() {
  return (
    <header className="app-header">
      <span className="app-identity">
        <img className="app-mark" src="./icon.svg" alt="" />
        <span className="app-name">
          <span className="type-heading-5">{BRAND.name}</span>
          <span className="app-endorsement type-eyebrow">{BRAND.endorsement}</span>
        </span>
      </span>
      <span className="family-chip type-label-sm">{BRAND.family}</span>
    </header>
  );
}

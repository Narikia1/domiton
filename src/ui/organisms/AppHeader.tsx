import { TEXT } from "../text.js";

export function AppHeader() {
  return (
    <header className="app-header">
      <span className="app-identity">
        <img className="app-mark" src="./icon.svg" alt="" />
        <span className="type-heading-5">{TEXT.appName}</span>
      </span>
      <span className="family-chip type-label-sm">{TEXT.familyName}</span>
    </header>
  );
}

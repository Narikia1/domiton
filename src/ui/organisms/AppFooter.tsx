import { TEXT } from "../text.js";

export function AppFooter() {
  return (
    <footer className="app-footer type-caption">
      <img className="narikia-logo" src="./brand/narikia.svg" alt="" />
      <span>{TEXT.familyLine}</span>
    </footer>
  );
}

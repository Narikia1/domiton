import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./tokens/tokens.css";
import "./fonts.css";
import "./base.css";
import "./atoms/atoms.css";
import "./molecules/molecules.css";
import "./organisms/organisms.css";
import "./templates/templates.css";
import { SearchPage } from "./pages/SearchPage.js";

document.documentElement.dataset.platform = window.domiton?.platform ?? "web";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <SearchPage />
  </StrictMode>,
);

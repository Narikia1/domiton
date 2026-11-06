import react from "@vitejs/plugin-react";
import type { PreviewServer, ViteDevServer } from "vite";
import { defineConfig, type Plugin } from "vitest/config";
import { handleCountry, handleLookup } from "./src/server/handler.js";
import { translator } from "./src/ui/i18n/messages.js";
import { PAGE_DARK, PAGE_LIGHT } from "./src/ui/tokens/surfaces.js";

/** Covers the website and the desktop apps. Their pages only ever load their own files. */
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self'",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

function contentSecurityPolicy(): Plugin {
  return {
    name: "domiton-content-security-policy",
    apply: "build",
    transformIndexHtml: (html) =>
      html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`),
  };
}

/** The page's first words and colours come from the catalogues and the tokens, like everything else. The app then switches to the person's language. */
function pageHead(): Plugin {
  const { t } = translator("en");
  return {
    name: "domiton-page-head",
    transformIndexHtml: (html) =>
      html
        .replace("__TITLE__", t("meta.title"))
        .replace("__DESCRIPTION__", t("meta.description"))
        .replace("__PAGE_LIGHT__", PAGE_LIGHT)
        .replace("__PAGE_DARK__", PAGE_DARK),
  };
}

/** Serves the API on this computer, the same way the deployed functions do. */
function lookupApi(): Plugin {
  const serve = (server: PreviewServer | ViteDevServer) => {
    const route = (path: string, handle: (request: Request) => Response | Promise<Response>) =>
      server.middlewares.use(path, (request, response) => {
        void Promise.resolve(handle(new Request(`http://localhost${request.originalUrl}`))).then(async (answer) => {
          response.statusCode = answer.status;
          response.setHeader("content-type", "application/json");
          response.end(await answer.text());
        });
      });
    route("/api/lookup", handleLookup);
    route("/api/country", handleCountry);
  };
  return { name: "domiton-lookup-api", configureServer: serve, configurePreviewServer: serve };
}

export default defineConfig({
  // Relative, because the desktop apps load these same files from inside the app.
  base: "./",
  plugins: [react(), pageHead(), contentSecurityPolicy(), lookupApi()],
  build: { outDir: "dist", assetsInlineLimit: 0 },
  test: { include: ["tests/**/*.test.ts"] },
});

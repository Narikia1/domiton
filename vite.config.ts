import react from "@vitejs/plugin-react";
import type { PreviewServer, ViteDevServer } from "vite";
import { defineConfig, type Plugin } from "vitest/config";
import { handleLookup } from "./src/server/handler.js";

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

/** Serves /api/lookup on this computer, the same way the deployed function does. */
function lookupApi(): Plugin {
  const serve = (server: PreviewServer | ViteDevServer) => {
    server.middlewares.use("/api/lookup", (request, response) => {
      void handleLookup(new Request(`http://localhost${request.originalUrl}`)).then(async (answer) => {
        response.statusCode = answer.status;
        response.setHeader("content-type", "application/json");
        response.end(await answer.text());
      });
    });
  };
  return { name: "domiton-lookup-api", configureServer: serve, configurePreviewServer: serve };
}

export default defineConfig({
  // Relative, because the desktop apps load these same files from inside the app.
  base: "./",
  plugins: [react(), contentSecurityPolicy(), lookupApi()],
  build: { outDir: "dist", assetsInlineLimit: 0 },
  test: { include: ["tests/**/*.test.ts"] },
});

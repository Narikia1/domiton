import { join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { app, BrowserWindow, ipcMain, Menu, nativeTheme, net, protocol, shell } from "electron";
import { lookup } from "../core/lookup.js";
import { BRAND } from "../data/brand.js";
import { MAX_INPUT } from "../data/limits.js";
import { isLocale } from "../data/locales.js";
import { PAGE_DARK, PAGE_LIGHT } from "../ui/tokens/surfaces.js";

/**
 * The Mac and Windows apps show the same pages as the website, but ask the registries themselves.
 * So they need no server, and lookups come from the user's own connection instead of a shared address.
 */
const ORIGIN = "app://domiton";
const PAGES = resolve(__dirname, "..", "dist");

protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

function servePages() {
  protocol.handle("app", (request) => {
    const { host, pathname } = new URL(request.url);
    const file = resolve(PAGES, decodeURIComponent(pathname).slice(1) || "index.html");
    if (host !== "domiton" || !file.startsWith(PAGES + sep)) return new Response(null, { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
}

let window: BrowserWindow | null = null;

function openWindow() {
  const isMac = process.platform === "darwin";
  window = new BrowserWindow({
    width: 720,
    height: 860,
    minWidth: 380,
    minHeight: 560,
    show: false,
    title: BRAND.name,
    backgroundColor: nativeTheme.shouldUseDarkColors ? PAGE_DARK : PAGE_LIGHT,
    titleBarStyle: isMac ? "hiddenInset" : "default",
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      contextIsolation: true,
      sandbox: true,
      // The system's own settings, which the page's language choice starts from.
      additionalArguments: [`--domiton-languages=${app.getPreferredSystemLanguages().join(",")}`, `--domiton-country=${app.getLocaleCountryCode()}`],
    },
  });
  window.once("ready-to-show", () => window?.show());
  window.on("closed", () => {
    window = null;
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) void shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(`${ORIGIN}/`)) event.preventDefault();
  });
  void window.loadURL(`${ORIGIN}/`);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (window?.isMinimized()) window.restore();
    window?.focus();
  });
  // A small tool has no reason to keep running with its window closed.
  app.on("window-all-closed", () => app.quit());

  void app.whenReady().then(() => {
    // Windows shows the default menu as a bar across the page. The Mac keeps it for copy and paste.
    if (process.platform !== "darwin") Menu.setApplicationMenu(null);
    servePages();
    ipcMain.handle("domiton:lookup", (event, query: unknown, locale: unknown) => {
      if (!event.senderFrame?.url.startsWith(`${ORIGIN}/`)) throw new Error("Lookup from an unknown page");
      return lookup(typeof query === "string" ? query.slice(0, MAX_INPUT) : "", isLocale(locale) ? locale : undefined);
    });
    openWindow();
  });
}

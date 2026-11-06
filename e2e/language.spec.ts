import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, expect, test, type Browser, type Page } from "@playwright/test";

/**
 * Opens the real app as a Mac set to other languages would, each time as if for the first time.
 * Only a Mac app can be given its languages like this, so these tests run on Macs.
 */
const PORT = 9339;
const packaged = process.env.DOMITON_APP;

test.skip(process.platform !== "darwin", "Only a Mac app takes its languages from the command line");

interface Opened {
  app: ChildProcess;
  browser: Browser;
  page: Page;
}

async function open(languages: string, profile = mkdtempSync(join(tmpdir(), "domiton-"))): Promise<Opened & { profile: string }> {
  const electron = createRequire(import.meta.url)("electron") as string;
  const arguments_ = [`--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "-AppleLanguages", `(${languages})`];
  const app = packaged ? spawn(packaged, arguments_, { stdio: "ignore" }) : spawn(electron, [".", ...arguments_], { stdio: "ignore" });

  const giveUpAt = Date.now() + 45_000;
  let browser: Browser | undefined;
  while (!browser) {
    try {
      browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
    } catch (error) {
      if (Date.now() > giveUpAt) throw error;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  const connected = browser;
  const pages = () => connected.contexts().flatMap((context) => context.pages()).filter((page) => page.url().startsWith("app://domiton"));
  await expect.poll(() => pages().length, { timeout: 20_000 }).toBeGreaterThan(0);
  return { app, browser: connected, page: pages()[0] as Page, profile };
}

async function close({ app, browser }: Opened) {
  await browser.close();
  app.kill();
  await once(app, "exit");
}

const language = (page: Page) => page.locator(".app-header select");

test.describe("the device's language comes first", () => {
  for (const [device, code, heading] of [
    ["de-CH", "de", "Finden Sie Ihre Domain"],
    ["fr-CD", "fr", "Trouvez votre domaine"],
    ["en-DE", "en", "Find your domain"],
    ["sw-KE, fr-FR", "fr", "Trouvez votre domaine"],
  ] as const) {
    test(`${device} opens in ${code}`, async () => {
      const opened = await open(device);
      await expect(opened.page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(language(opened.page)).toHaveValue(code);
      await expect(opened.page.locator("html")).toHaveAttribute("lang", code);
      await close(opened);
    });
  }
});

test("a device with none of the app's languages still opens in one of them", async () => {
  const opened = await open("es-ES");
  await expect(opened.page.locator("h1")).toBeVisible();
  expect(["en", "de", "fr"]).toContain(await language(opened.page).inputValue());
  await close(opened);
});

test("the person's own choice beats the device, and lasts", async () => {
  const first = await open("de-DE");
  await expect(language(first.page)).toHaveValue("de");
  await language(first.page).selectOption("fr");
  await expect(first.page.getByRole("heading", { name: "Trouvez votre domaine" })).toBeVisible();
  await close(first);

  const again = await open("de-DE", first.profile);
  await expect(again.page.getByRole("heading", { name: "Trouvez votre domaine" })).toBeVisible();
  await expect(language(again.page)).toHaveValue("fr");
  await close(again);
});

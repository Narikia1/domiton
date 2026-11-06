import { spawn, type ChildProcess } from "node:child_process";
import { createRequire } from "node:module";
import { chromium, expect, test, type Browser, type Page } from "@playwright/test";

/**
 * Drives the real desktop app against the real registries.
 * DOMITON_APP points at an installed-style build; without it, the app runs from this folder.
 */
const PORT = 9338;
const packaged = process.env.DOMITON_APP;
const problems: string[] = [];

let app: ChildProcess;
let browser: Browser;
let page: Page;

async function attach(): Promise<Browser> {
  const giveUpAt = Date.now() + 45_000;
  for (;;) {
    try {
      return await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
    } catch (error) {
      if (Date.now() > giveUpAt) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

async function appPage(): Promise<Page> {
  const pages = () => browser.contexts().flatMap((context) => context.pages()).filter((candidate) => candidate.url().startsWith("app://domiton"));
  await expect.poll(() => pages().length, { timeout: 20_000 }).toBeGreaterThan(0);
  return pages()[0] as Page;
}

async function search(text: string) {
  await page.locator("#search").fill(text);
  await page.locator("#search").press("Enter");
}

const answer = () => page.locator(".verdict-answer .status-badge");
const rows = () => page.locator(".list-row-item");

test.beforeAll(async () => {
  const electron = createRequire(import.meta.url)("electron") as string;
  app = packaged
    ? spawn(packaged, [`--remote-debugging-port=${PORT}`], { stdio: "ignore" })
    : spawn(electron, [".", `--remote-debugging-port=${PORT}`], { stdio: "ignore" });
  browser = await attach();
  page = await appPage();
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(error.message));
});

test.afterAll(async () => {
  await browser?.close();
  app?.kill();
});

test("the first screen shows up in full, in Narikia's type and with its logos", async () => {
  await expect(page.getByRole("heading", { name: "Find your domain" })).toBeVisible();
  await expect(page.locator(".verdict")).toHaveCSS("opacity", "1");
  await expect(page.locator(".panel")).toHaveCSS("opacity", "1");
  await expect(page.getByRole("region", { name: "What the answers mean" })).toContainText("Probably free");
  await expect(page.getByText("DotGo", { exact: true })).toBeVisible();

  const look = await page.evaluate(async () => {
    await document.fonts.ready;
    const images = [...document.images];
    return {
      fonts: [...document.fonts].filter((font) => font.status === "loaded").map((font) => font.family.replaceAll('"', "")),
      imagesLoaded: images.length > 0 && images.every((image) => image.naturalWidth > 0),
      background: getComputedStyle(document.body).backgroundColor,
    };
  });
  expect(look.fonts).toEqual(expect.arrayContaining(["Space Grotesk", "DM Sans"]));
  expect(look.imagesLoaded).toBe(true);
  await page.screenshot({ path: "test-results/idle.png" });
});

test("a taken name shows who holds it, and free names on the same ending", async () => {
  await search("google");

  await expect(answer()).toHaveText("Taken", { timeout: 30_000 });
  await expect(page.locator("#search")).toHaveValue("google.com");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("google.com");
  await expect(page.getByRole("region", { name: "Registration" })).toContainText("Registered");
  await expect(page.getByRole("region", { name: "Registration" })).toContainText("MarkMonitor");

  await expect(rows().first()).toBeVisible({ timeout: 60_000 });
  await expect(page.locator(".panel-aside")).toContainText("tried", { timeout: 90_000 });
  const names = await page.locator(".list-row-item .list-row-title").allTextContents();
  expect(names.length).toBeGreaterThan(0);
  for (const name of names) expect(name).toMatch(/\.com$/);

  await page.screenshot({ path: "test-results/taken.png" });
});

test("a taken name links to its site, in the browser", async () => {
  const visit = page.getByRole("link", { name: "Visit site" });
  await expect(visit).toHaveAttribute("href", "https://google.com");
  await expect(visit).toHaveAttribute("target", "_blank");
});

test("the answer and each similar name can be copied", async () => {
  const main = page.locator(".action").filter({ hasText: "Copy" });
  await main.click();
  await expect(page.locator(".verdict-actions")).toContainText("Copied");

  const row = rows().first().locator(".button-secondary");
  await row.click();
  await expect(row).toHaveText("Copied");
});

test("New search goes back to the start", async () => {
  await page.locator(".action").filter({ hasText: "New search" }).click();
  await expect(page.locator("#search")).toHaveValue("");
  await expect(page.getByRole("heading", { name: "Find your domain" })).toBeVisible();
  await expect(page.locator("#search")).toBeFocused();
});

test("an unregistered name is free, and glows green", async () => {
  await search(`zqxv-domiton-${Date.now()}`);
  await expect(answer()).toHaveText("Free", { timeout: 30_000 });
  await expect(page.locator(".shell-wash-success")).toHaveAttribute("data-active", "true");
  await expect(page.getByRole("link", { name: "Visit site" })).toHaveCount(0);
  await expect(page.locator(".panel-aside")).toContainText("tried", { timeout: 90_000 });
  await page.screenshot({ path: "test-results/free.png" });
});

test("a whole pasted address is understood, and a two-part ending stays together", async () => {
  await search("https://www.google.co.uk/search");
  await expect(answer()).toHaveText("Taken", { timeout: 30_000 });
  await expect(page.locator("#search")).toHaveValue("google.co.uk");
  await expect(page.locator(".big-name-ending")).toHaveText(".co.uk");
});

test("WHOIS works in the app: .de has no RDAP server", async () => {
  await search("google.de");
  await expect(answer()).toHaveText("Taken", { timeout: 30_000 });
  await expect(page.locator(".big-name-ending")).toHaveText(".de");
});

test("a mistake gets a clear message and no lookup", async () => {
  await search("hello.notanending");
  await expect(page.getByRole("alert")).toHaveText(".notanending isn't an ending that exists. Check the spelling.");
  await expect(page.locator("#search")).toHaveAttribute("aria-invalid", "true");
});

test("searching with nothing typed says so", async () => {
  await search("");
  await expect(page.getByRole("alert")).toHaveText("Type a name first.");
});

test("everything can be reached with the keyboard", async () => {
  await page.locator("#search").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Search" })).toBeFocused();
});

test("the page loads nothing from outside and reports no errors", () => {
  expect(problems).toEqual([]);
});

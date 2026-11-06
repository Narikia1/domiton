import { spawn, type ChildProcess } from "node:child_process";
import { createRequire } from "node:module";
import AxeBuilder from "@axe-core/playwright";
import { chromium, expect, test, type Browser, type Page } from "@playwright/test";
import { hostingerLink } from "../src/data/hostinger.js";

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
  // The tests read English, whatever language this computer is set to.
  await page.evaluate(() => localStorage.setItem("domiton.language", "en"));
  await page.reload();
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
  await expect(page.getByText("DotGo")).toHaveCount(0);
  await expect(page.locator(".app-header select")).toHaveValue("en");

  // The logo, then the name, then BY NARIKIA under the name.
  await expect(page.locator(".app-endorsement")).toHaveText("BY NARIKIA");
  const mark = await page.locator(".app-mark").boundingBox();
  const name = await page.locator(".app-name > :first-child").boundingBox();
  const endorsement = await page.locator(".app-endorsement").boundingBox();
  expect(name!.x).toBeGreaterThanOrEqual(mark!.x + mark!.width);
  expect(endorsement!.x).toBe(name!.x);
  expect(endorsement!.y).toBeGreaterThanOrEqual(name!.y + name!.height);

  // The search sits in the middle of the window.
  const windowHeight = await page.evaluate(() => innerHeight);
  const field = await page.locator("#search").boundingBox();
  expect(Math.abs(field!.y + field!.height / 2 - windowHeight / 2)).toBeLessThan(windowHeight * 0.1);

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
  await expect(page.locator(".verdict-answer")).toHaveCSS("opacity", "1");
  // With an answer, the search moves to the top to leave it room, and keeps the cursor.
  await expect(page.locator("#search")).toBeFocused();
  const field = await page.locator("#search").boundingBox();
  expect(field!.y).toBeLessThan((await page.evaluate(() => innerHeight)) / 4);
  await expect(page.getByRole("region", { name: "Registration" })).toContainText("Registered");
  await expect(page.getByRole("region", { name: "Registration" })).toContainText("MarkMonitor");

  await expect(rows().first()).toBeVisible({ timeout: 60_000 });
  await expect(page.locator(".panel-aside")).toContainText("tried", { timeout: 90_000 });
  const names = await page.locator(".list-row-item .list-row-title").allTextContents();
  expect(names.length).toBeGreaterThan(0);
  for (const name of names) expect(name).toMatch(/\.com$/);

  await page.screenshot({ path: "test-results/taken.png" });
});

test("a taken name has nothing to get, only its free neighbours do", async () => {
  await expect(page.locator(".action").filter({ hasText: "Get it" })).toHaveCount(0);
  await expect(rows().first().getByRole("link")).toHaveAttribute("rel", "sponsored noreferrer");
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

  const row = rows().first().getByRole("button");
  await row.click();
  await expect(row).toHaveText("Copied");
});

test("New search goes back to the start", async () => {
  await page.locator(".action").filter({ hasText: "New search" }).first().click();
  await expect(page.locator("#search")).toHaveValue("");
  await expect(page.getByRole("heading", { name: "Find your domain" })).toBeVisible();
  await expect(page.locator("#search")).toBeFocused();
  const windowHeight = await page.evaluate(() => innerHeight);
  const field = await page.locator("#search").boundingBox();
  expect(Math.abs(field!.y + field!.height / 2 - windowHeight / 2)).toBeLessThan(windowHeight * 0.1);
});

test("an unregistered name is free, and glows green", async () => {
  await search(`zqxv-domiton-${Date.now()}`);
  await expect(answer()).toHaveText("Free", { timeout: 30_000 });
  await expect(page.locator(".shell-wash-success")).toHaveAttribute("data-active", "true");
  await expect(page.getByRole("link", { name: "Visit site" })).toHaveCount(0);
  await expect(page.locator(".panel-aside")).toContainText("tried", { timeout: 90_000 });

  // Hostinger sells .com, so the name and each suggestion can be got there, and the app says it's an affiliate link.
  const get = page.locator(".action").filter({ hasText: "Get it" });
  await expect(get).toHaveAttribute("href", hostingerLink("com", "en") as string);
  await expect(get).toHaveAttribute("rel", "sponsored noreferrer");
  await expect(rows().first().getByRole("link")).toHaveAttribute("href", hostingerLink("com", "en") as string);
  await expect(page.locator(".affiliate-note")).toContainText("affiliate link");
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

test(".cd has no server in IANA's list, and still gets the registry's own answer", async () => {
  await search("google.cd");
  await expect(answer()).toHaveText("Taken", { timeout: 30_000 });
  await expect(page.getByRole("region", { name: "Registration" })).toContainText("Registrar");
  await search(`zqxv-domiton-${Date.now()}.cd`);
  await expect(answer()).toHaveText("Free", { timeout: 30_000 });
  // Hostinger doesn't sell .cd, so there's no link to it, and nothing to disclose.
  await expect(page.locator(".panel-aside").last()).toContainText("tried", { timeout: 90_000 });
  await expect(page.locator('a[rel~="sponsored"]')).toHaveCount(0);
  await expect(page.locator(".affiliate-note")).toHaveCount(0);
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

test("speaks German and French, and remembers the choice", async () => {
  await page.locator(".app-header select").selectOption("de");
  await expect(page.getByRole("heading", { name: "Finden Sie Ihre Domain" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page).toHaveTitle(/Domainname/);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Finden Sie Ihre Domain" })).toBeVisible();
  await expect(page.locator(".app-header select")).toHaveValue("de");

  await search("google.com");
  await expect(answer()).toHaveText("Vergeben", { timeout: 30_000 });
  await expect(page.getByRole("region", { name: "Registrierung" })).toContainText("Registriert");
  await expect(rows().first().getByRole("link")).toHaveAttribute("href", hostingerLink("com", "de") as string);
  await expect(page.locator(".affiliate-note")).toContainText("Affiliate-Link");

  await page.locator(".app-header select").selectOption("fr");
  await expect(answer()).toHaveText("Déjà pris");
  await expect(rows().first().getByRole("link")).toHaveAttribute("href", hostingerLink("com", "fr") as string);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");

  await page.locator(".app-header select").selectOption("en");
  await expect(answer()).toHaveText("Taken");
});

test("meets WCAG 2.2 AA on every screen, in every language", async () => {
  const violations = async (screen: string) => {
    // Text that is still fading in measures as weak contrast, so everything has to settle first.
    await expect(page.locator(".skeleton")).toHaveCount(0, { timeout: 90_000 });
    await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
    const { violations } = await new AxeBuilder({ page }).setLegacyMode(true).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    return violations.map((violation) => `${screen}: ${violation.id} on ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`);
  };
  const found: string[] = [];
  for (const language of ["en", "de", "fr"]) {
    await page.locator(".app-header select").selectOption(language);
    await page.locator(".action").last().click().catch(() => undefined);
    await expect(page.locator(".verdict-title")).toBeVisible();
    found.push(...(await violations(`${language}, first screen`)));
    await search("google.com");
    await expect(answer()).toBeVisible({ timeout: 30_000 });
    found.push(...(await violations(`${language}, answer`)));
  }
  await page.locator(".app-header select").selectOption("en");
  expect(found).toEqual([]);
});

test("the page loads nothing from outside and reports no errors", () => {
  expect(problems).toEqual([]);
});

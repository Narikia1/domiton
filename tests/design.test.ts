import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/** Narikia's design rules, checked here so that breaking one fails the build. */
const UI = join(process.cwd(), "src/ui");
const TOKENS = join(UI, "tokens");

const files = (ending: string) =>
  (readdirSync(UI, { recursive: true }) as string[])
    .map((file) => join(UI, file))
    .filter((file) => file.endsWith(ending) && !file.startsWith(TOKENS));

const tokens = readFileSync(join(TOKENS, "tokens.css"), "utf8");

/** Variables a component sets for itself, rather than values from the design tokens. */
const LOCAL_VARIABLES = new Set(["--letters", "--status-background", "--status-foreground", "--wash-colour"]);

describe("the design tokens are the only source of how things look", () => {
  it("no stylesheet holds a raw colour", () => {
    for (const file of files(".css")) {
      const raw = readFileSync(file, "utf8").match(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/gi);
      expect(raw, relative(UI, file)).toBeNull();
    }
  });

  it("no component holds a raw colour", () => {
    for (const file of files(".tsx")) {
      const raw = readFileSync(file, "utf8").match(/#[0-9a-f]{6}\b|\brgba?\(/gi);
      expect(raw, relative(UI, file)).toBeNull();
    }
  });

  it("every variable a stylesheet uses is a real token", () => {
    for (const file of files(".css")) {
      for (const [, name] of readFileSync(file, "utf8").matchAll(/var\((--[a-z0-9-]+)/g)) {
        if (LOCAL_VARIABLES.has(name as string)) continue;
        expect(tokens, `${relative(UI, file)} uses ${name}`).toContain(`${name}:`);
      }
    }
  });

  it("every type style a component uses exists", () => {
    for (const file of files(".tsx")) {
      for (const [, name] of readFileSync(file, "utf8").matchAll(/\b(type-[a-z0-9-]+)/g)) {
        expect(tokens, `${relative(UI, file)} uses ${name}`).toContain(`.${name} {`);
      }
    }
  });

  it("app code never reaches for a primitive", () => {
    expect(tokens).not.toMatch(/--(color|space|radius|shadow|motion|font|size)-/);
  });

  it("carries Narikia's own identity", () => {
    expect(tokens).toContain("--semantic-action-primary-background: #4285F4");
    expect(tokens).toContain("--semantic-highlight-background: #FBBC05");
    expect(tokens).toContain('"Space Grotesk"');
    expect(tokens).toContain('"DM Sans"');
  });

  it("takes all motion away for people who ask for that", () => {
    const reduced = tokens.slice(tokens.indexOf("prefers-reduced-motion"));
    expect(reduced).toContain("--animation-enter-duration: 0ms");
    expect(reduced).toContain("--animation-overlay-duration: 0ms");
  });

  it("no stylesheet holds a raw size", () => {
    // A hidden label's 1px, and the one breakpoint, because media queries can't read variables.
    const allowed = new Set(["1px", tokens.match(/--breakpoint-sm: (\d+px)/)?.[1]]);
    for (const file of files(".css")) {
      for (const [raw] of readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/\b\d+(?:\.\d+)?(?:px|rem)\b/g)) {
        expect(allowed, `${relative(UI, file)} holds ${raw}`).toContain(raw);
      }
    }
  });

  it("the page's own head takes its colours from the tokens", () => {
    expect(readFileSync("index.html", "utf8")).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it("only animates what stays smooth", () => {
    for (const file of files(".css")) {
      for (const [, properties] of readFileSync(file, "utf8").matchAll(/@keyframes [^{]+\{([\s\S]*?)\n\}/g)) {
        const animated = [...(properties as string).matchAll(/^\s+([a-z-]+):/gm)].map((match) => match[1]);
        for (const property of animated) expect(["opacity", "transform"], relative(UI, file)).toContain(property);
      }
    }
  });
});

describe("text stays readable, in both themes", () => {
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * (r as number) + 0.7152 * (g as number) + 0.0722 * (b as number);
  };
  const contrast = (a: string, b: string) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
    return (high + 0.05) / (low + 0.05);
  };
  const darkStart = tokens.indexOf("prefers-color-scheme: dark");
  const themes = { light: tokens.slice(0, darkStart), dark: tokens.slice(darkStart) };
  // The dark block only holds what differs from the light one.
  const value = (theme: string, name: string) => {
    const read = (css: string) => css.match(new RegExp(`${name}: (#[0-9A-Fa-f]{6})`))?.[1];
    const found = read(theme) ?? read(themes.light);
    expect(found, name).toBeDefined();
    return found as string;
  };

  it.each(Object.entries(themes))("%s: words on every surface reach AA", (_, theme) => {
    for (const text of ["--semantic-text-primary", "--semantic-text-secondary"]) {
      for (const surface of ["--semantic-surface-page", "--semantic-surface-card"]) {
        expect(contrast(value(theme, text), value(theme, surface)), `${text} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it.each(Object.entries(themes))("%s: the icon on the primary button stands out", (_, theme) => {
    expect(contrast(value(theme, "--button-variant-primary-foreground"), value(theme, "--button-variant-primary-background"))).toBeGreaterThanOrEqual(3);
  });
});

describe("the generated tokens match Narikia's source", () => {
  const source = process.env.NARIKIA_TOKENS ?? join(homedir(), "App Projects/narikia/design-tokens");

  // The source isn't in this repository, so this runs on computers that have it.
  it.runIf(existsSync(source))("regenerating changes nothing", () => {
    const before = readFileSync(join(TOKENS, "tokens.css"), "utf8");
    execFileSync(process.execPath, ["scripts/generate-tokens.mjs"], { stdio: "ignore" });
    expect(readFileSync(join(TOKENS, "tokens.css"), "utf8")).toBe(before);
  });
});

describe("words live in the catalogues", () => {
  it("no component holds its own text", () => {
    for (const file of files(".tsx")) {
      const source = readFileSync(file, "utf8");
      expect(source.match(/>\s*[A-Z][a-z]+[^<{]*</g), relative(UI, file)).toBeNull();
      expect(source.match(/\b(?:label|title|placeholder|aria-label)="[A-Za-z]/g), relative(UI, file)).toBeNull();
    }
  });
});

describe("components only build on the layers below them", () => {
  const LAYERS = ["atoms", "molecules", "organisms", "templates", "pages"];

  it.each(LAYERS)("%s", (layer) => {
    const below = LAYERS.slice(0, LAYERS.indexOf(layer) + 1);
    for (const file of files(".tsx").filter((path) => relative(UI, path).startsWith(`${layer}/`))) {
      for (const [, target] of readFileSync(file, "utf8").matchAll(/from "\.\.\/([a-z]+)\//g)) {
        if (!LAYERS.includes(target as string)) continue;
        expect(below, `${relative(UI, file)} imports ${target}`).toContain(target);
      }
    }
  });

  it("atoms and molecules have no state of the search", () => {
    for (const file of files(".tsx").filter((path) => /^(atoms|molecules)\//.test(relative(UI, path)))) {
      expect(readFileSync(file, "utf8"), relative(UI, file)).not.toMatch(/useSearch|client\.js|fetch\(/);
    }
  });
});

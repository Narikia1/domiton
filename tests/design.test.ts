import { readdirSync, readFileSync } from "node:fs";
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

  it("only animates what stays smooth", () => {
    for (const file of files(".css")) {
      for (const [, properties] of readFileSync(file, "utf8").matchAll(/@keyframes [^{]+\{([\s\S]*?)\n\}/g)) {
        const animated = [...(properties as string).matchAll(/^\s+([a-z-]+):/gm)].map((match) => match[1]);
        for (const property of animated) expect(["opacity", "transform"], relative(UI, file)).toContain(property);
      }
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

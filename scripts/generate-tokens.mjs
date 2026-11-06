// Generates src/ui/tokens from Narikia's design tokens, the single source of truth for how
// Narikia's apps look. Run it when those tokens change. The output is committed, because
// the release machines can't read the Narikia folder. Never edit the output by hand.
//
// App code may only use the semantic and component tiers, so only those are written out.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = process.env.NARIKIA_TOKENS ?? join(homedir(), "App Projects/narikia/design-tokens");
const out = join(root, "src/ui/tokens");

/** The tiers app code may use, plus the breakpoints, which have no semantic tier. */
const PUBLIC = /^(semantic|typography|rounding|spacing|elevation|animation|button|card|input|badge|link|breakpoint)\./;
/** Written instructions in the token files, not values a stylesheet could use. */
const NOT_CSS = /\.(technique|properties|cursor)$/;
const DURATION = /(duration)$/;

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function merge(into, from) {
  for (const [key, value] of Object.entries(from)) {
    if (isObject(value) && isObject(into[key])) merge(into[key], value);
    else into[key] = value;
  }
  return into;
}

async function loadFolder(folder) {
  const tree = {};
  for (const file of (await readdir(join(source, folder))).filter((name) => name.endsWith(".json")).sort()) {
    merge(tree, JSON.parse(await readFile(join(source, folder, file), "utf8")));
  }
  return tree;
}

function flatten(tree, path = [], found = new Map()) {
  for (const [key, value] of Object.entries(tree)) {
    if (key.startsWith("$") || !isObject(value)) continue;
    if ("$value" in value) found.set([...path, key].join("."), value.$value);
    else flatten(value, [...path, key], found);
  }
  return found;
}

function resolveValue(value, tokens) {
  if (typeof value === "string") {
    const reference = /^\{(.+)\}$/.exec(value);
    if (!reference) return value;
    if (!tokens.has(reference[1])) throw new Error(`Unknown token: ${value}`);
    return resolveValue(tokens.get(reference[1]), tokens);
  }
  if (Array.isArray(value)) return value.map((item) => resolveValue(item, tokens));
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveValue(item, tokens)]));
  return value;
}

const kebab = (text) => text.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const variable = (path) => `--${path.split(".").map(kebab).join("-")}`;

function cssValue(value) {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "number")) return `cubic-bezier(${value.join(", ")})`;
    return value.map((item) => (/\s/.test(item) ? `"${item}"` : item)).join(", ");
  }
  return String(value);
}

/** One token becomes one variable, except a type style, which becomes one per property. */
function variables(tokens) {
  const css = new Map();
  for (const [path, raw] of tokens) {
    if (!PUBLIC.test(path) || NOT_CSS.test(path)) continue;
    const value = resolveValue(raw, tokens);
    if (isObject(value) && "offsetX" in value) {
      css.set(variable(path), `${value.offsetX} ${value.offsetY} ${value.blur} ${value.spread} ${value.color}`);
    } else if (isObject(value)) {
      for (const [property, item] of Object.entries(value)) css.set(`${variable(path)}-${kebab(property)}`, cssValue(item));
    } else {
      css.set(variable(path), cssValue(value));
    }
  }
  return css;
}

const block = (selector, entries, indent = "") =>
  `${indent}${selector} {\n${entries.map(([name, value]) => `${indent}  ${name}: ${value};`).join("\n")}\n${indent}}\n`;

const base = merge(merge(merge(await loadFolder("primitives"), await loadFolder("semantic")), await loadFolder("components")), await loadFolder("brands"));
const theme = async (name) => flatten(merge(structuredClone(base), JSON.parse(await readFile(join(source, "themes", `${name}.json`), "utf8"))));

const lightTokens = await theme("light");
const darkTokens = await theme("dark");
const light = variables(lightTokens);
const dark = variables(darkTokens);

/** One class per type style, so components choose a role and never restate its properties. */
const typeClasses = [...lightTokens]
  .filter(([path]) => path.startsWith("typography."))
  .map(([path, raw]) =>
    block(
      `.type-${path.slice("typography.".length).replaceAll(".", "-")}`,
      Object.keys(resolveValue(raw, lightTokens)).map((property) => [kebab(property), `var(${variable(path)}-${kebab(property)})`]),
    ),
  );

const css = [
  "/* Generated from Narikia's design tokens by scripts/generate-tokens.mjs. Do not edit. */\n",
  block(":root", [...light]),
  ...typeClasses,
  block("@media (prefers-color-scheme: dark)", []).replace(/\{\n\n\}\n$/, `{\n${block(":root", [...dark].filter(([name, value]) => light.get(name) !== value), "  ")}}\n`),
  block("@media (prefers-reduced-motion: reduce)", []).replace(/\{\n\n\}\n$/, `{\n${block(":root", [...light.keys()].filter((name) => DURATION.test(name)).map((name) => [name, "0ms"]), "  ")}}\n`),
].join("\n");

const surfaces = `// Generated from Narikia's design tokens by scripts/generate-tokens.mjs. Do not edit.
export const PAGE_LIGHT = ${JSON.stringify(light.get("--semantic-surface-page"))};
export const PAGE_DARK = ${JSON.stringify(dark.get("--semantic-surface-page"))};
`;

await mkdir(out, { recursive: true });
await writeFile(join(out, "tokens.css"), css);
await writeFile(join(out, "surfaces.ts"), surfaces);
console.log(`Wrote ${light.size} tokens to src/ui/tokens.`);

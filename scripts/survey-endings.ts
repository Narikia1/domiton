// Asks about every ending in IANA's list and writes docs/coverage.md: which ones the
// registry answers for, and which rest on DNS. It takes a while, and runs by hand:
//   npm run survey
import { writeFileSync } from "node:fs";
import { domainToUnicode } from "node:url";
import { checkDomain } from "../src/core/check.js";

const ENDINGS_URL = "https://data.iana.org/TLD/tlds-alpha-by-domain.txt";
/** Names likely to be registered on most endings. */
const KNOWN_NAMES = ["google", "nic", "gov", "com", "amazon", "microsoft", "facebook", "wikipedia"];
/** Registries limit how fast they answer, and going faster only measures their limits. */
const AT_ONCE = 6;
const RETRY_AT_ONCE = 3;

type Quality = "confirmed" | "free-only" | "dns" | "none" | "wrong";

const madeUp = `qzxvdmtn${Math.random().toString(36).slice(2, 8).replace(/[^a-z0-9]/g, "x")}`;

async function measure(ending: string): Promise<Quality> {
  let knownSource: string | null = null;
  for (const name of KNOWN_NAMES) {
    const check = await checkDomain(`${name}.${ending}`);
    if (check.status === "taken") {
      knownSource = check.source;
      break;
    }
  }
  const free = await checkDomain(`${madeUp}.${ending}`);
  if (free.status === "free") return knownSource === "registry" ? "confirmed" : "free-only";
  if (free.status === "likely-free") return "dns";
  return free.status === "taken" ? "wrong" : "none";
}

async function inParallel(endings: string[], width: number, results: Map<string, Quality>) {
  const queue = [...endings];
  const worker = async () => {
    for (let ending = queue.shift(); ending; ending = queue.shift()) results.set(ending, await measure(ending));
  };
  await Promise.all(Array.from({ length: width }, worker));
}

const list = await (await fetch(ENDINGS_URL)).text();
const endings = list.split("\n").filter((line) => line && !line.startsWith("#")).map((line) => line.toLowerCase());

const results = new Map<string, Quality>();
await inParallel(endings, AT_ONCE, results);
await inParallel(endings.filter((ending) => results.get(ending) !== "confirmed"), RETRY_AT_ONCE, results);

const of = (quality: Quality) => endings.filter((ending) => results.get(ending) === quality).map((ending) => `.${domainToUnicode(ending)}`);
const section = (title: string, intro: string, items: string[]) => (items.length ? `\n## ${title}\n\n${intro}\n\n${items.join(", ")}\n` : "");
const date = new Date().toISOString().slice(0, 10);

writeFileSync(
  "docs/coverage.md",
  `# Coverage

How each of the ${endings.length} endings in IANA's list answered on ${date}, from one computer, measured by \`npm run survey\`. Registries can treat other addresses differently, and some change their rules.

| How it answers | Endings | What the app says |
|---|---|---|
| The registry told a registered name from a made-up one | ${of("confirmed").length} | "Free" or "Taken", with the record's details where the registry shares them |
| The registry says a made-up name is free, with no registered test name to compare | ${of("free-only").length} | The same. Many of these are endings in other scripts, or closed to the public |
| The registry won't answer, so this rests on DNS | ${of("dns").length} | "Probably free", and "Taken" when a name has live name servers |
| Nobody answered this time | ${of("none").length} | "Can't tell" |
| A made-up name looked taken | ${of("wrong").length} | "Taken", wrongly, because the ending answers for every name |
${section("The registry won't answer", "These refuse public lookups, or answer only some networks. The app never calls a name here \"free\".", of("dns"))}${section("Nobody answered", "Worth measuring again, as this is often temporary.", of("none"))}${section("A made-up name looked taken", "These need looking into.", of("wrong"))}`,
);
console.log(`${endings.length} endings measured. See docs/coverage.md.`);
process.exit(0);

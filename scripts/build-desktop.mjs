// Builds what the Mac and Windows apps need: the website's pages in dist/, the app's
// own code in dist-desktop/, and the icons in build/, drawn from public/icon.svg.
import { mkdir, readFile, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build as bundle } from "esbuild";
import sharp from "sharp";
import { build as buildPages } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist-desktop");
await rm(out, { recursive: true, force: true });

await buildPages({ root, logLevel: "warn" });

const node = { bundle: true, minify: true, platform: "node", target: "node22", format: "cjs", external: ["electron"], logLevel: "warning" };
await bundle({ ...node, entryPoints: [join(root, "src/desktop/main.ts")], outfile: join(out, "main.cjs") });
await bundle({ ...node, entryPoints: [join(root, "src/desktop/preload.ts")], outfile: join(out, "preload.cjs") });

// macOS lays app icons on a 1024 grid with the artwork in the middle 824. Windows uses the whole square.
const svg = await readFile(join(root, "public/icon.svg"));
const art = (size) => sharp(svg, { density: 1200 }).resize(size, size).png();
await mkdir(join(root, "build"), { recursive: true });
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: await art(824).toBuffer(), left: 100, top: 100 }])
  .png()
  .toFile(join(root, "build/icon-mac.png"));
await art(256).toFile(join(root, "build/icon-win.png"));

console.log("Desktop app built.");

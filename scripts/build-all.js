#!/usr/bin/env node
// Build orchestrator.
// 1. Clean dist/
// 2. pnpm -r --filter "./contents/*" run build
// 3. Generate slides.json (index for the homepage)

import { execFileSync } from "node:child_process";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(__dirname);
const contentsDir = join(rootDir, "contents");
const distDir = join(rootDir, "dist");

// 1. Clean dist/
await rm(distDir, { recursive: true, force: true });
console.log("[build-all] cleaned dist/");

// 2. Fan out via pnpm workspace. --parallel runs slides concurrently.
execFileSync(
  "pnpm",
  ["-r", "--parallel", "--filter", "./contents/*", "run", "build"],
  { cwd: rootDir, stdio: "inherit" },
);

// 3. Collect slide metadata and write slides.json.
const slides = [];
for (const id of await readdir(contentsDir)) {
  const pkgPath = join(contentsDir, id, "package.json");
  try {
    const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
    if (!pkg.slidev) continue;
    slides.push({
      id,
      title: pkg.slidev.title || id,
      date: pkg.slidev.date || "",
      description: pkg.slidev.description || "",
      url: `/${id}/`,
    });
  } catch {
    // ignore non-slide entries
  }
}

const sorted = slides.sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
);

await writeFile(
  join(distDir, "slides.json"),
  JSON.stringify({ slides: sorted, generatedAt: new Date().toISOString() }, null, 2),
);
console.log(`[build-all] wrote slides.json (${sorted.length} slides)`);

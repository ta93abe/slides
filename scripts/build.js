#!/usr/bin/env node
// Per-slide build wrapper.
// Usage: node ../../scripts/build.js /<slide-id>/
// Invoked from a slide directory by its package.json `build` script.

import { execFileSync } from "node:child_process";
import { cp, mkdir, copyFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(__dirname);
const distDir = join(rootDir, "dist");
const distStaleDir = join(rootDir, "dist-stale");
const sharedFavicon = join(rootDir, "assets", "favicon.png");

const basePath = process.argv[2];
if (!basePath || !basePath.startsWith("/") || !basePath.endsWith("/")) {
  console.error(`[build] Usage: node ../../scripts/build.js /<slide-id>/`);
  process.exit(1);
}

const slideId = basePath.slice(1, -1);
const slideDir = process.cwd();
const outDir = join(distDir, slideId);
const stalePath = join(distStaleDir, slideId);

// 1. dist-stale cache: if a previous build exists, copy it over and skip slidev.
if (existsSync(stalePath)) {
  console.log(`[${slideId}] using dist-stale cache (delete dist-stale/${slideId} to rebuild)`);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(dirname(outDir), { recursive: true });
  await cp(stalePath, outDir, { recursive: true });
  process.exit(0);
}

// 2. Copy the shared favicon into the slide's public dir.
const publicDir = join(slideDir, "public");
await mkdir(publicDir, { recursive: true });
await copyFile(sharedFavicon, join(publicDir, "favicon.png"));

// 3. Run slidev build for this slide.
console.log(`[${slideId}] building...`);
execFileSync(
  "pnpm",
  ["exec", "slidev", "build", "--base", basePath, "--out", outDir],
  {
    cwd: slideDir,
    stdio: "inherit",
    env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=1536" },
  },
);

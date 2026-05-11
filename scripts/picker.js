#!/usr/bin/env node
// Interactive picker.
// Usage:
//   node scripts/picker.js          # default: dev
//   node scripts/picker.js dev
//   node scripts/picker.js build
//   node scripts/picker.js export
//
// Lists slides from contents/, lets you select one, then runs
// `pnpm --filter <slide> run <cmd>` in the workspace root.

import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import prompts from "prompts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(__dirname);
const contentsDir = join(rootDir, "contents");

const cmd = process.argv[2] || "dev";
const VALID_CMDS = ["dev", "build", "export"];
if (!VALID_CMDS.includes(cmd)) {
  console.error(`[picker] unknown command: ${cmd}`);
  console.error(`[picker] valid: ${VALID_CMDS.join(" / ")}`);
  process.exit(1);
}

const choices = [];
for (const id of await readdir(contentsDir)) {
  const pkgPath = join(contentsDir, id, "package.json");
  try {
    const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
    if (!pkg.slidev) continue;
    const date = pkg.slidev.date || "";
    const title = pkg.slidev.title || id;
    choices.push({
      title: date ? `${title}  (${date})` : title,
      value: pkg.name || id,
      description: pkg.slidev.description,
      _date: date,
    });
  } catch {
    // ignore
  }
}

// Newest first.
choices.sort((a, b) => (b._date || "").localeCompare(a._date || ""));

if (choices.length === 0) {
  console.error("[picker] no slides found in contents/ (need package.json with a `slidev` field)");
  process.exit(1);
}

const { id } = await prompts({
  type: "select",
  name: "id",
  message: `Run \`pnpm ${cmd}\` in which slide?`,
  choices,
});

if (!id) {
  console.log("[picker] cancelled");
  process.exit(0);
}

execFileSync("pnpm", ["--filter", id, "run", cmd], {
  cwd: rootDir,
  stdio: "inherit",
});

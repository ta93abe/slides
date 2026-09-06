import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DeckError } from "../src/parser/types.ts";
import { parseDeck } from "../src/parser/parse-deck.ts";
import {
  renderDeckPage,
  renderListingPage,
  renderNotFoundPage,
} from "../src/render/html.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const decksDir = path.join(root, "decks");

async function concatCss(files: string[]): Promise<string> {
  const parts = [];
  for (const file of files) {
    parts.push(await readFile(file, "utf8"));
  }
  return parts.join("\n");
}

async function main() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(path.join(dist, "assets"), { recursive: true });
  await mkdir(path.join(dist, "media"), { recursive: true });

  const designSystem = await concatCss([
    path.join(root, "src/design-system/tokens.css"),
    path.join(root, "src/design-system/typography.css"),
    path.join(root, "src/design-system/layouts.css"),
  ]);
  await writeFile(path.join(dist, "assets/design-system.css"), designSystem);
  await writeFile(
    path.join(dist, "assets/player.css"),
    await readFile(path.join(root, "src/player/player.css"), "utf8"),
  );
  await writeFile(
    path.join(dist, "assets/listing.css"),
    await readFile(path.join(root, "src/design-system/listing.css"), "utf8"),
  );
  await writeFile(
    path.join(dist, "assets/player.js"),
    await readFile(path.join(root, "src/player/player.js"), "utf8"),
  );
  await writeFile(
    path.join(dist, "assets/favicon.svg"),
    await readFile(path.join(root, "src/design-system/favicon.svg"), "utf8"),
  );

  const files = (await readdir(decksDir))
    .filter((name) => name.endsWith(".md"))
    .sort();

  const listing = [];
  for (const name of files) {
    const filename = path.join(decksDir, name);
    const markdown = await readFile(filename, "utf8");
    let deck;
    try {
      deck = await parseDeck(markdown, { filename });
    } catch (error) {
      const message =
        error instanceof DeckError ? error.message : String(error);
      throw new Error(`${name}: ${message}`);
    }

    const outDir = path.join(dist, deck.frontmatter.slug);
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, "index.html"), renderDeckPage(deck));

    const mediaSrc = path.join(decksDir, deck.frontmatter.slug);
    try {
      await cp(mediaSrc, path.join(dist, "media", deck.frontmatter.slug), {
        recursive: true,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }

    listing.push(deck.frontmatter);
  }

  listing.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  await writeFile(path.join(dist, "index.html"), renderListingPage(listing));
  await writeFile(path.join(dist, "404.html"), renderNotFoundPage());
  await writeFile(
    path.join(dist, "manifest.json"),
    `${JSON.stringify({ decks: listing }, null, 2)}\n`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

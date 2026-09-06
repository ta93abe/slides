import { basename } from "node:path";
import { findForbidden } from "./forbidden.ts";
import { markdownToHtml } from "./markdown.ts";
import { splitSlides } from "./split-slides.ts";
import {
  DECK_FRONTMATTER_KEYS,
  DeckError,
  isSlideType,
  type Deck,
  type DeckFrontmatter,
  type Slide,
  type SlideType,
} from "./types.ts";

const TYPE_AT_START = /^\s*<!--\s*type:\s*([a-z]+)\s*-->\s*/;
const NOTES_BLOCK = /<!--\s*notes\b([\s\S]*?)-->/g;
const COLUMN_MARK = /<!--\s*column\s*-->/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

function parseYamlBlock(text: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trimEnd();
    if (line.trim() === "" || line.trim().startsWith("#")) {
      continue;
    }
    const idx = line.indexOf(":");
    if (idx === -1) {
      throw new DeckError(`frontmatter を解釈できません: ${line}`);
    }
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return data;
}

function parseFrontmatter(
  data: Record<string, unknown>,
  filename?: string,
): DeckFrontmatter {
  const keys = Object.keys(data);
  const allowed = new Set<string>(DECK_FRONTMATTER_KEYS);
  const unknown = keys.filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw new DeckError(
      `frontmatter に見た目または未知のキーがあります: ${unknown.join(", ")}`,
    );
  }

  for (const key of DECK_FRONTMATTER_KEYS) {
    const value = data[key];
    if (typeof value !== "string" || value.trim() === "") {
      throw new DeckError(`frontmatter の ${key} は必須です`);
    }
  }

  const title = String(data.title).trim();
  const date = String(data.date).trim();
  const description = String(data.description).trim();
  const slug = String(data.slug).trim();

  if (!DATE_PATTERN.test(date)) {
    throw new DeckError(`date は YYYY-MM-DD にしてください: ${date}`);
  }
  if (!SLUG_PATTERN.test(slug)) {
    throw new DeckError(`slug は英小文字・数字・ハイフンだけです: ${slug}`);
  }
  if (filename) {
    const fromFile = basename(filename, ".md");
    if (fromFile !== slug) {
      throw new DeckError(
        `ファイル名 ${fromFile}.md と slug ${slug} が一致しません`,
      );
    }
  }

  return { title, date, description, slug };
}

function extractNotes(source: string): { notes: string; body: string } {
  const notes: string[] = [];
  const body = source
    .replace(NOTES_BLOCK, (_all, inner: string) => {
      notes.push(inner.replace(/^\s*\n/, "").trimEnd());
      return "\n";
    })
    .trim();
  return { notes: notes.join("\n\n").trim(), body };
}

async function parseSlide(
  source: string,
  slug: string,
  index: number,
): Promise<Slide> {
  let rest = source;
  let type: SlideType = "body";
  const typeMatch = rest.match(TYPE_AT_START);
  if (typeMatch) {
    if (!isSlideType(typeMatch[1])) {
      throw new DeckError(
        `スライド ${index + 1}: 未知の型です: ${typeMatch[1]}`,
      );
    }
    type = typeMatch[1];
    rest = rest.slice(typeMatch[0].length);
  }

  if (/<!--\s*type:/i.test(rest)) {
    throw new DeckError(
      `スライド ${index + 1}: type コメントは先頭に 1 つだけ置いてください`,
    );
  }

  const extracted = extractNotes(rest);
  rest = extracted.body;

  const columnParts = rest.split(COLUMN_MARK);
  if (type === "split") {
    if (columnParts.length !== 2) {
      throw new DeckError(
        `スライド ${index + 1}: split は <!-- column --> を 1 つだけ使って左右を分けます`,
      );
    }
    const left = await markdownToHtml(columnParts[0].trim(), slug);
    const right = await markdownToHtml(columnParts[1].trim(), slug);
    return {
      type,
      html: `<div class="split-pane">${left}</div><div class="split-pane">${right}</div>`,
      notes: extracted.notes,
      columns: [left, right],
    };
  }

  if (columnParts.length > 1) {
    throw new DeckError(
      `スライド ${index + 1}: <!-- column --> は split 型だけで使います`,
    );
  }

  const html = await markdownToHtml(rest, slug);
  if (!html) {
    throw new DeckError(`スライド ${index + 1}: 本文が空です`);
  }

  return { type, html, notes: extracted.notes };
}

export async function parseDeck(
  markdown: string,
  options: { filename?: string } = {},
): Promise<Deck> {
  const forbidden = findForbidden(markdown);
  if (forbidden.length > 0) {
    throw new DeckError(forbidden.join(" / "));
  }

  const fm = markdown.match(FRONTMATTER);
  if (!fm) {
    throw new DeckError("ファイル先頭に YAML frontmatter が必要です");
  }
  if (fm[1].trim() === "") {
    throw new DeckError("YAML frontmatter が空です");
  }

  const frontmatter = parseFrontmatter(parseYamlBlock(fm[1]), options.filename);
  const chunks = splitSlides(markdown.slice(fm[0].length));
  if (chunks.length === 0) {
    throw new DeckError("スライドが 1 枚もありません");
  }

  const slides: Slide[] = [];
  for (const [index, chunk] of chunks.entries()) {
    slides.push(await parseSlide(chunk, frontmatter.slug, index));
  }

  return { frontmatter, slides };
}

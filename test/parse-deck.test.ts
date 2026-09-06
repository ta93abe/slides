import { describe, expect, it } from "vitest";
import { parseDeck } from "../src/parser/parse-deck.ts";
import { DeckError } from "../src/parser/types.ts";
import { splitSlides } from "../src/parser/split-slides.ts";

const header = `---
title: サンプル
date: 2026-09-06
description: 説明
slug: sample
---
`;

async function parse(body: string, filename = "sample.md") {
  return parseDeck(`${header}\n${body}`, { filename });
}

describe("splitSlides", () => {
  it("does not split inside fenced code", () => {
    const chunks = splitSlides(`# one\n\n\`\`\`md\n---\nnot a slide\n\`\`\`\n\n---\n\n# two`);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toContain("not a slide");
  });
});

describe("parseDeck", () => {
  it("defaults unspecified slides to body", async () => {
    const deck = await parse("# 本文\n\n段落");
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0]?.type).toBe("body");
    expect(deck.slides[0]?.html).toContain("<h1>");
  });

  it("reads type comments and notes", async () => {
    const deck = await parse(`<!-- type: cover -->\n\n# 表紙\n\n<!-- notes\n話す\n-->`);
    expect(deck.slides[0]?.type).toBe("cover");
    expect(deck.slides[0]?.notes.trim()).toBe("話す");
  });

  it("splits columns", async () => {
    const deck = await parse(
      `<!-- type: split -->\n\n## 左\n\n<!-- column -->\n\n## 右`,
    );
    expect(deck.slides[0]?.type).toBe("split");
    expect(deck.slides[0]?.columns).toHaveLength(2);
    expect(deck.slides[0]?.html).toContain("split-pane");
  });

  it("rejects unknown frontmatter keys", async () => {
    await expect(
      parseDeck(`---\ntitle: t\ndate: 2026-09-06\ndescription: d\nslug: sample\ntheme: dark\n---\n\n# x`, {
        filename: "sample.md",
      }),
    ).rejects.toBeInstanceOf(DeckError);
  });

  it("rejects MDX import", async () => {
    await expect(parse("import X from './x'\n\n# hi")).rejects.toMatchObject({
      name: "DeckError",
    });
  });

  it("rejects JSX components", async () => {
    await expect(parse("<Counter />\n")).rejects.toBeInstanceOf(DeckError);
  });

  it("rejects unknown types", async () => {
    await expect(parse("<!-- type: hero -->\n\n# x")).rejects.toBeInstanceOf(
      DeckError,
    );
  });

  it("parses GFM tables", async () => {
    const deck = await parse("| a | b |\n| --- | --- |\n| 1 | 2 |");
    expect(deck.slides[0]?.html).toContain("<table>");
  });
});

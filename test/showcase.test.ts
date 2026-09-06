import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseDeck } from "../src/parser/parse-deck.ts";

describe("showcase deck", () => {
  it("covers every slide type", async () => {
    const filename = path.resolve("decks/showcase.md");
    const markdown = await readFile(filename, "utf8");
    const deck = await parseDeck(markdown, { filename });
    expect(deck.slides.map((slide) => slide.type)).toEqual([
      "cover",
      "section",
      "body",
      "split",
      "quote",
      "code",
      "figure",
    ]);
    expect(deck.slides[5]?.html).toContain("shiki");
    expect(deck.slides[6]?.html).toContain("/media/showcase/frame.svg");
  });
});

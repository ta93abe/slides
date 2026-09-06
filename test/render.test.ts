import { describe, expect, it } from "vitest";
import { renderDeckPage, renderListingPage } from "../src/render/html.ts";
import type { Deck } from "../src/parser/types.ts";

const deck: Deck = {
  frontmatter: {
    title: "明るい紙面",
    date: "2026-09-06",
    description: "説明",
    slug: "light",
    theme: "light",
  },
  slides: [{ type: "body", html: "<p>x</p>", notes: "" }],
};

describe("render", () => {
  it("puts the deck theme on html", () => {
    const html = renderDeckPage(deck);
    expect(html).toContain('data-theme="light"');
    expect(html).toContain("color-scheme: light");
    expect(html).toContain('href="/light.pdf"');
  });

  it("keeps the listing on dark and shows theme pills", () => {
    const html = renderListingPage([deck.frontmatter]);
    expect(html).toContain('data-theme="dark"');
    expect(html).toContain("color-scheme: dark");
    expect(html).toContain("theme-pill");
    expect(html).toContain(">light<");
  });
});

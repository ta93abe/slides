export const SLIDE_TYPES = [
  "cover",
  "section",
  "body",
  "split",
  "quote",
  "code",
  "figure",
] as const;

export type SlideType = (typeof SLIDE_TYPES)[number];

export const REQUIRED_FRONTMATTER_KEYS = [
  "title",
  "date",
  "description",
  "slug",
] as const;

export const COLOR_THEMES = ["dark", "light"] as const;

export type ColorTheme = (typeof COLOR_THEMES)[number];

export const DECK_FRONTMATTER_KEYS = [
  ...REQUIRED_FRONTMATTER_KEYS,
  "theme",
] as const;

export type DeckFrontmatter = {
  title: string;
  date: string;
  description: string;
  slug: string;
  theme: ColorTheme;
};

export type Slide = {
  type: SlideType;
  html: string;
  notes: string;
  columns?: [string, string];
};

export type Deck = {
  frontmatter: DeckFrontmatter;
  slides: Slide[];
};

export class DeckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeckError";
  }
}

export function isSlideType(value: string): value is SlideType {
  return (SLIDE_TYPES as readonly string[]).includes(value);
}

export function isColorTheme(value: string): value is ColorTheme {
  return (COLOR_THEMES as readonly string[]).includes(value);
}

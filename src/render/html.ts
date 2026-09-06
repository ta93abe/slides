import type { Deck, DeckFrontmatter } from "../parser/types.ts";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderDeckPage(
  deck: Deck,
  options: { print?: boolean } = {},
): string {
  const { title, description, slug, theme } = deck.frontmatter;
  const print = options.print === true;
  const slides = deck.slides
    .map((slide, index) => {
      const notes = slide.notes
        ? `<div class="speaker-notes">${escapeHtml(slide.notes)}</div>`
        : "";
      const active = print || index === 0 ? " is-active" : "";
      const hidden = print || index === 0 ? "" : " hidden inert";
      return `<section class="slide${active}" data-type="${slide.type}" data-index="${index + 1}" id="s${index + 1}" aria-label="${index + 1} / ${deck.slides.length}"${hidden}>
  <div class="slide-body">${slide.html}</div>
  ${notes}
</section>`;
    })
    .join("\n");

  const player = print
    ? ""
    : `  <div class="player-ui">
    <div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="${deck.slides.length}" aria-valuenow="1"><i></i></div>
    <p class="counter" aria-live="polite"><span data-current>1</span> / ${deck.slides.length}</p>
    <a class="pdf-link" href="/${escapeHtml(slug)}.pdf">PDF</a>
  </div>
  <script src="/assets/player.js" type="module"></script>
`;

  return `<!DOCTYPE html>
<html lang="ja"${print ? " data-print-ready class=\"is-print\"" : ""} data-theme="${escapeHtml(theme)}" style="color-scheme: ${escapeHtml(theme)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/design-system.css">
  <link rel="stylesheet" href="/assets/player.css">
  ${print ? "" : `<link rel="alternate" type="application/pdf" href="/${escapeHtml(slug)}.pdf">`}
</head>
<body>
  <div class="stage-wrap">
    <article class="deck" data-slug="${escapeHtml(slug)}" data-length="${deck.slides.length}">
      ${slides}
    </article>
  </div>
${player}</body>
</html>
`;
}

export function renderListingPage(decks: DeckFrontmatter[]): string {
  const cards = decks
    .map(
      (deck) => `<a class="card" href="/${escapeHtml(deck.slug)}">
  <div class="meta">
    <time datetime="${escapeHtml(deck.date)}">${escapeHtml(deck.date)}</time>
    <span class="theme-pill">${escapeHtml(deck.theme)}</span>
  </div>
  <h2>${escapeHtml(deck.title)}</h2>
  <p>${escapeHtml(deck.description)}</p>
</a>`,
    )
    .join("\n");

  const empty =
    decks.length === 0
      ? `<p class="empty">公開デッキはまだありません。</p>`
      : cards;

  return `<!DOCTYPE html>
<html lang="ja" data-theme="dark" style="color-scheme: dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Slides</title>
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/design-system.css">
  <link rel="stylesheet" href="/assets/listing.css">
</head>
<body class="listing">
  <header class="listing-head">
    <p class="eyebrow">ta93abe</p>
    <h1>Slides</h1>
    <p>Markdown に本文だけ書く。見た目はデザインシステムが担う。</p>
  </header>
  <main class="card-grid">
    ${empty}
  </main>
</body>
</html>
`;
}

export function renderNotFoundPage(): string {
  return `<!DOCTYPE html>
<html lang="ja" data-theme="dark" style="color-scheme: dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>見つかりません</title>
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/design-system.css">
  <link rel="stylesheet" href="/assets/listing.css">
</head>
<body class="listing">
  <header class="listing-head">
    <p class="eyebrow">404</p>
    <h1>そのデッキはありません</h1>
    <p><a href="/">一覧へ戻る</a></p>
  </header>
</body>
</html>
`;
}

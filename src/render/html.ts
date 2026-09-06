import type { Deck } from "../parser/types.ts";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderDeckPage(deck: Deck): string {
  const { title, description, slug } = deck.frontmatter;
  const slides = deck.slides
    .map((slide, index) => {
      const notes = slide.notes
        ? `<div class="speaker-notes">${escapeHtml(slide.notes)}</div>`
        : "";
      return `<section class="slide" data-type="${slide.type}" data-index="${index + 1}" id="s${index + 1}" aria-label="${index + 1} / ${deck.slides.length}">
  <div class="slide-body">${slide.html}</div>
  ${notes}
</section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/assets/design-system.css">
  <link rel="stylesheet" href="/assets/player.css">
</head>
<body>
  <div class="stage-wrap">
    <article class="deck" data-slug="${escapeHtml(slug)}" data-length="${deck.slides.length}">
      ${slides}
    </article>
  </div>
  <div class="player-ui">
    <div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="${deck.slides.length}" aria-valuenow="1"><i></i></div>
    <p class="counter" aria-live="polite"><span data-current>1</span> / ${deck.slides.length}</p>
  </div>
  <script src="/assets/player.js" type="module"></script>
</body>
</html>
`;
}

export function renderListingPage(
  decks: Array<{ title: string; date: string; description: string; slug: string }>,
): string {
  const cards = decks
    .map(
      (deck) => `<a class="card" href="/${escapeHtml(deck.slug)}">
  <time datetime="${escapeHtml(deck.date)}">${escapeHtml(deck.date)}</time>
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
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Slides</title>
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
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>見つかりません</title>
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

import { execFileSync } from "node:child_process";
import { readdir, readFile, rm, mkdir, writeFile, stat, copyFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const slidesDir = join(__dirname, "contents");
const distDir = join(__dirname, "dist");
const sharedFavicon = join(__dirname, "assets", "favicon.png");

async function copyFaviconToSlide(slideDir) {
  const publicDir = join(slideDir, "public");
  await mkdir(publicDir, { recursive: true });
  await copyFile(sharedFavicon, join(publicDir, "favicon.png"));
}

// Auto-detect slide projects
async function detectSlides() {
  const slides = [];
  const entries = await readdir(slidesDir);

  for (const entry of entries) {
    const entryPath = join(slidesDir, entry);
    const entryStat = await stat(entryPath).catch(() => null);
    if (!entryStat?.isDirectory()) continue;

    const pkgPath = join(entryPath, "package.json");

    try {
      const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
      if (!pkg.slidev) continue;

      slides.push({
        id: entry,
        title: pkg.slidev.title || entry,
        date: pkg.slidev.date || "",
        description: pkg.slidev.description || "",
      });
    } catch {
      // No package.json or invalid JSON, skip
    }
  }

  return slides;
}

// Clean dist directory
await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

// Detect slides
const slides = await detectSlides();
console.log(`Found ${slides.length} slide(s): ${slides.map((s) => s.id).join(", ")}\n`);

// Build each slide
for (const slide of slides) {
  console.log(`Building ${slide.id}...`);
  const slideDir = join(slidesDir, slide.id);
  const outDir = join(distDir, slide.id);

  await copyFaviconToSlide(slideDir);

  execFileSync(
    "pnpm",
    ["slidev", "build", "--base", `/${slide.id}/`, "--out", outDir],
    {
      cwd: slideDir,
      stdio: "inherit",
      env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=1536" },
    },
  );
}

// Sort slides by date (newest first)
const sortedSlides = slides
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .map((slide) => ({
    ...slide,
    url: `/${slide.id}/`,
  }));

// Generate slides.json
const slidesJson = {
  slides: sortedSlides,
  generatedAt: new Date().toISOString(),
};
await writeFile(join(distDir, "slides.json"), JSON.stringify(slidesJson, null, 2));
console.log("Generated slides.json");

// Generate _redirects for Cloudflare Pages
const redirects = `/ https://ta93abe.com/slides 302`;
await writeFile(join(distDir, "_redirects"), redirects);
console.log("Generated _redirects");

console.log("\nBuild complete! Output in ./dist/");

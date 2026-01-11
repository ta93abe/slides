import { join } from "jsr:@std/path";

const __dirname = import.meta.dirname!;
const distDir = join(__dirname, "dist");

// Directories to ignore
const IGNORE_DIRS = ["node_modules", "dist", ".git", ".scaffdog", ".vscode"];

interface Slide {
  id: string;
  title: string;
  date: string;
  description: string;
}

interface SlideWithUrl extends Slide {
  url: string;
}

// Auto-detect slide projects
async function detectSlides(): Promise<Slide[]> {
  const slides: Slide[] = [];

  for await (const entry of Deno.readDir(__dirname)) {
    if (!entry.isDirectory || IGNORE_DIRS.includes(entry.name)) continue;

    const pkgPath = join(__dirname, entry.name, "package.json");

    try {
      const pkg = JSON.parse(await Deno.readTextFile(pkgPath));
      if (!pkg.slidev) continue;

      slides.push({
        id: entry.name,
        title: pkg.slidev.title || entry.name,
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
try {
  await Deno.remove(distDir, { recursive: true });
} catch {
  // Directory doesn't exist, ignore
}
await Deno.mkdir(distDir, { recursive: true });

// Detect slides
const slides = await detectSlides();
console.log(`Found ${slides.length} slide(s): ${slides.map((s) => s.id).join(", ")}\n`);

// Build each slide
for (const slide of slides) {
  console.log(`Building ${slide.id}...`);
  const slideDir = join(__dirname, slide.id);
  const outDir = join(distDir, slide.id);

  const command = new Deno.Command("pnpm", {
    args: ["slidev", "build", "--base", `/${slide.id}/`, "--out", outDir],
    cwd: slideDir,
    stdout: "inherit",
    stderr: "inherit",
  });

  const { code } = await command.output();
  if (code !== 0) {
    console.error(`Failed to build ${slide.id}`);
    Deno.exit(1);
  }
}

// Sort slides by date (newest first)
const sortedSlides: SlideWithUrl[] = slides
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
await Deno.writeTextFile(
  join(distDir, "slides.json"),
  JSON.stringify(slidesJson, null, 2)
);
console.log("Generated slides.json");

// Generate _redirects for Cloudflare Pages
const redirects = `/ https://ta93abe.com/slides 302`;
await Deno.writeTextFile(join(distDir, "_redirects"), redirects);
console.log("Generated _redirects");

console.log("\nBuild complete! Output in ./dist/");

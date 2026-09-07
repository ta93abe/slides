import type { Context } from "hono";
import {
  deckVersion,
  pdfObjectKey,
  writePdfEvent,
  type PdfJob,
} from "./pdf.ts";

export async function servePdf(
  c: Context<{ Bindings: Env }>,
  slug: string,
): Promise<Response> {
  const page = await c.env.ASSETS.fetch(
    new URL(`/${slug}/index.html`, c.req.url),
  );
  if (page.status === 404) {
    const missing = await c.env.ASSETS.fetch(
      new URL("/404.html", c.req.url),
    );
    return new Response(missing.body, {
      status: 404,
      headers: missing.headers,
    });
  }

  const source = await page.text();
  const version = await deckVersion(source);
  const key = pdfObjectKey(slug);
  const stored = await c.env.R2.get(key);
  if (stored && stored.customMetadata?.version === version) {
    writePdfEvent(c.env, slug, "hit");
    return new Response(stored.body, {
      headers: {
        "content-type":
          stored.httpMetadata?.contentType ?? "application/pdf",
        "content-disposition": `inline; filename="${slug}.pdf"`,
        etag: `"${version}"`,
        "cache-control": "public, max-age=60",
      },
    });
  }

  const job: PdfJob = {
    slug,
    origin: new URL(c.req.url).origin,
    version,
  };
  await c.env.PDF_QUEUE.send(job);
  writePdfEvent(c.env, slug, "generating");
  return new Response(
    JSON.stringify({ ok: true, status: "generating", slug }),
    {
      status: 202,
      headers: {
        "content-type": "application/json",
        "retry-after": "3",
      },
    },
  );
}

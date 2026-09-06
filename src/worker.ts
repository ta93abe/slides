import { Hono } from "hono";
import type { Context } from "hono";
import { bindingPresence } from "./bindings.ts";
import { isPrintQuery } from "./pdf.ts";
import { handlePdfQueue } from "./pdf-queue.ts";
import { servePdf } from "./pdf-route.ts";

export type Bindings = Env;

export { PdfWorkflow } from "./pdf-workflow.ts";
export { handlePdfQueue };

const app = new Hono<{ Bindings: Bindings }>();

async function asset(
  env: Bindings,
  request: Request,
  path: string,
  status?: number,
): Promise<Response> {
  const url = new URL(path, request.url);
  const response = await env.ASSETS.fetch(url.toString());
  if (status && status !== response.status) {
    return new Response(response.body, {
      status,
      headers: response.headers,
    });
  }
  return response;
}

app.get("/health", (c) =>
  c.json({
    ok: true,
    bindings: bindingPresence(c.env),
  }),
);

app.get("/favicon.ico", (c) =>
  asset(c.env, c.req.raw, "/assets/favicon.svg"),
);

app.get("/", (c) => asset(c.env, c.req.raw, "/index.html"));

async function deckPage(c: Context<{ Bindings: Bindings }>) {
  const slug = c.req.param("slug") ?? "";
  if (slug.endsWith(".pdf")) {
    return servePdf(c, slug.slice(0, -".pdf".length));
  }
  if (slug.includes(".") || slug === "assets" || slug === "media") {
    return c.env.ASSETS.fetch(c.req.raw);
  }

  const path = isPrintQuery(c.req.query("print"))
    ? `/${slug}/print.html`
    : `/${slug}/index.html`;
  const page = await asset(c.env, c.req.raw, path);
  if (page.status === 404) {
    return asset(c.env, c.req.raw, "/404.html", 404);
  }
  return page;
}

app.get("/:slug", deckPage);
app.get("/:slug/", deckPage);

app.all("*", async (c) => {
  const response = await c.env.ASSETS.fetch(c.req.raw);
  if (response.status === 404) {
    return asset(c.env, c.req.raw, "/404.html", 404);
  }
  return response;
});

export { app };

const worker = {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
  queue: handlePdfQueue,
};

export default worker;

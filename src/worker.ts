import { Hono } from "hono";
import type { Context } from "hono";
import { bindingPresence } from "./bindings.ts";

export type Bindings = Env;

export { PdfWorkflow } from "./pdf-workflow.ts";

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
  if (slug.includes(".") || slug === "assets" || slug === "media") {
    return c.env.ASSETS.fetch(c.req.raw);
  }

  const page = await asset(c.env, c.req.raw, `/${slug}/index.html`);
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

export default app;

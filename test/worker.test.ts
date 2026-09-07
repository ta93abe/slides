import { describe, expect, it } from "vitest";
import worker, { app, PdfWorkflow } from "../src/worker.ts";

const html = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });

const assets = {
  fetch: async (input: RequestInfo | URL) => {
    const url = new URL(
      input instanceof Request ? input.url : String(input),
    );
    if (url.pathname === "/index.html") {
      return html("<html>list</html>");
    }
    if (url.pathname === "/showcase/index.html") {
      return html("<html>deck</html>");
    }
    if (url.pathname === "/404.html") {
      return html("<html>missing</html>", 404);
    }
    return html("no", 404);
  },
} as Fetcher;

describe("worker", () => {
  it("returns health json with binding presence", async () => {
    const response = await app.request("/health", {}, { ASSETS: assets });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      bindings: {
        ASSETS: true,
        R2: false,
        BROWSER: false,
        IMAGES: false,
        PDF_QUEUE: false,
        ANALYTICS: false,
        PDF_WORKFLOW: false,
      },
    });
  });

  it("serves the listing at /", async () => {
    const response = await app.request("/", {}, { ASSETS: assets });
    expect(await response.text()).toContain("list");
  });

  it("serves a deck at /:slug", async () => {
    const response = await app.request("/showcase", {}, { ASSETS: assets });
    expect(await response.text()).toContain("deck");
  });

  it("serves a deck through the Worker fetch export", async () => {
    const { fetch } = worker;
    const response = await fetch(
      new Request("https://example.com/showcase"),
      { ASSETS: assets } as Env,
      {} as ExecutionContext,
    );
    expect(await response.text()).toContain("deck");
  });

  it("serves a deck at /:slug/", async () => {
    const response = await app.request("/showcase/", {}, { ASSETS: assets });
    expect(await response.text()).toContain("deck");
  });

  it("uses the 404 page for unknown slugs", async () => {
    const response = await app.request("/no-such-deck", {}, { ASSETS: assets });
    expect(response.status).toBe(404);
    expect(await response.text()).toContain("missing");
  });

  it("maps favicon.ico to the svg asset", async () => {
    const withIcon = {
      ...assets,
      fetch: async (input: RequestInfo | URL) => {
        const url = new URL(input instanceof Request ? input.url : String(input));
        if (url.pathname === "/assets/favicon.svg") {
          return new Response("<svg></svg>", {
            headers: { "content-type": "image/svg+xml" },
          });
        }
        return assets.fetch(input);
      },
    } as Fetcher;
    const response = await app.request("/favicon.ico", {}, { ASSETS: withIcon });
    expect(await response.text()).toContain("<svg");
  });

  it("reports wired bindings as present without calling them", async () => {
    const response = await app.request(
      "/health",
      {},
      {
        ASSETS: assets,
        R2: {},
        BROWSER: {},
        IMAGES: {},
        PDF_QUEUE: {},
        ANALYTICS: {},
        PDF_WORKFLOW: {},
      },
    );
    expect(await response.json()).toEqual({
      ok: true,
      bindings: {
        ASSETS: true,
        R2: true,
        BROWSER: true,
        IMAGES: true,
        PDF_QUEUE: true,
        ANALYTICS: true,
        PDF_WORKFLOW: true,
      },
    });
  });

  it("exports the registered PDF Workflow class", () => {
    expect(typeof PdfWorkflow).toBe("function");
  });
});

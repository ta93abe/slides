import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PdfWorkflow } from "../src/pdf-workflow.ts";
import {
  PDF_PAGE,
  PDF_QUICK_ACTION,
  deckVersion,
  pdfObjectKey,
  pdfWorkflowId,
  printDeckUrl,
} from "../src/pdf.ts";
import { handlePdfQueue } from "../src/pdf-queue.ts";
import { renderDeckPage } from "../src/render/html.ts";
import { app } from "../src/worker.ts";
import type { Deck } from "../src/parser/types.ts";

const pdfBytes = new TextEncoder().encode("%PDF-1.4 showcase");
const deckHtml = "<html>showcase deck</html>";

const html = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });

const assets = {
  fetch: async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname === "/showcase/index.html") {
      return html(deckHtml);
    }
    if (url.pathname === "/showcase/print.html") {
      return html('<html data-print-ready class="is-print">print</html>');
    }
    if (url.pathname === "/404.html") {
      return html("<html>missing</html>", 404);
    }
    return html("no", 404);
  },
} as Fetcher;

function memoryR2(
  initial: Array<{
    key: string;
    body: Uint8Array;
    version?: string;
  }> = [],
) {
  const objects = new Map<
    string,
    {
      body: Uint8Array;
      httpMetadata: { contentType: string };
      customMetadata: Record<string, string>;
    }
  >();
  for (const item of initial) {
    objects.set(item.key, {
      body: item.body,
      httpMetadata: { contentType: "application/pdf" },
      customMetadata: item.version ? { version: item.version } : {},
    });
  }
  return {
    objects,
    async get(key: string) {
      const object = objects.get(key);
      if (!object) {
        return null;
      }
      return {
        body: object.body,
        httpMetadata: object.httpMetadata,
        customMetadata: object.customMetadata,
        arrayBuffer: async () =>
          object.body.buffer.slice(
            object.body.byteOffset,
            object.body.byteOffset + object.body.byteLength,
          ),
      };
    },
    async put(
      key: string,
      value: ArrayBuffer | ArrayBufferView | string,
      options?: {
        httpMetadata?: { contentType?: string };
        customMetadata?: Record<string, string>;
      },
    ) {
      const body =
        typeof value === "string"
          ? new TextEncoder().encode(value)
          : value instanceof ArrayBuffer
            ? new Uint8Array(value)
            : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      objects.set(key, {
        body,
        httpMetadata: {
          contentType: options?.httpMetadata?.contentType ?? "application/pdf",
        },
        customMetadata: options?.customMetadata ?? {},
      });
    },
    async head(key: string) {
      const object = objects.get(key);
      if (!object) {
        return null;
      }
      return {
        size: object.body.byteLength,
        httpMetadata: object.httpMetadata,
        customMetadata: object.customMetadata,
      };
    },
    async delete(key: string) {
      objects.delete(key);
    },
  };
}

const twoSlides: Deck = {
  frontmatter: {
    title: "ショーケース",
    date: "2026-09-06",
    description: "説明",
    slug: "showcase",
    theme: "dark",
  },
  slides: [
    { type: "cover", html: "<h1>表紙</h1>", notes: "" },
    { type: "body", html: "<p>本文</p>", notes: "話す" },
  ],
};

describe("PDF page contract (TA-811)", () => {
  it("uses a 16:9 page without a named paper format", () => {
    expect(PDF_PAGE).toEqual({ width: "13.333in", height: "7.5in" });
    expect(PDF_QUICK_ACTION.pdfOptions).toEqual(
      expect.objectContaining({
        printBackground: true,
        preferCSSPageSize: true,
        width: "13.333in",
        height: "7.5in",
      }),
    );
    expect("format" in PDF_QUICK_ACTION.pdfOptions).toBe(false);
    expect("landscape" in PDF_QUICK_ACTION.pdfOptions).toBe(false);
    expect(PDF_QUICK_ACTION.emulateMediaType).toBe("print");
  });

  it("points Browser Run at the public print URL", () => {
    expect(printDeckUrl("https://slides.example", "showcase")).toBe(
      "https://slides.example/showcase?print=1",
    );
  });

  it("overrides hidden slides in print CSS so one slide is one page", () => {
    const css = readFileSync("src/player/player.css", "utf8");
    const print = css.split("@media print")[1] ?? "";
    expect(print).toContain(".slide[hidden]");
    expect(print).toContain("display: flex !important");
    expect(print).toContain("size: 13.333in 7.5in;");
    expect(print).not.toContain("landscape");
    expect(css).toContain("html.is-print .slide[hidden]");
  });
});

describe("GET /:slug.pdf", () => {
  it("returns the R2 object when the stored version matches the deck", async () => {
    const version = await deckVersion(deckHtml);
    const response = await app.request(
      "https://slides.example/showcase.pdf",
      {},
      {
        ASSETS: assets,
        R2: memoryR2([
          { key: pdfObjectKey("showcase"), body: pdfBytes, version },
        ]),
        PDF_QUEUE: { send: async () => undefined },
        ANALYTICS: { writeDataPoint: () => undefined },
      },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/pdf");
    expect(response.headers.get("content-disposition")).toContain(
      "showcase.pdf",
    );
    expect(await response.text()).toContain("%PDF");
  });

  it("enqueues generation and returns 202 when the PDF is missing", async () => {
    const sent: unknown[] = [];
    const response = await app.request(
      "https://slides.example/showcase.pdf",
      {},
      {
        ASSETS: assets,
        R2: memoryR2(),
        PDF_QUEUE: {
          send: async (body: unknown) => {
            sent.push(body);
          },
        },
        ANALYTICS: { writeDataPoint: () => undefined },
      },
    );
    expect(response.status).toBe(202);
    expect(response.headers.get("retry-after")).toBeTruthy();
    expect(await response.json()).toEqual({
      ok: true,
      status: "generating",
      slug: "showcase",
    });
    expect(sent).toEqual([
      {
        slug: "showcase",
        origin: "https://slides.example",
        version: await deckVersion(deckHtml),
      },
    ]);
  });

  it("uses the 404 page for unknown decks", async () => {
    const response = await app.request(
      "/no-such-deck.pdf",
      {},
      {
        ASSETS: assets,
        R2: memoryR2(),
        PDF_QUEUE: { send: async () => undefined },
      },
    );
    expect(response.status).toBe(404);
    expect(await response.text()).toContain("missing");
  });
});

describe("GET /:slug?print=1", () => {
  it("serves the print HTML, not the player", async () => {
    const response = await app.request(
      "/showcase?print=1",
      {},
      { ASSETS: assets },
    );
    expect(await response.text()).toContain("data-print-ready");
  });
});

describe("print HTML", () => {
  it("shows every slide and skips the player script", () => {
    const page = renderDeckPage(twoSlides, { print: true });
    expect(page).toContain('data-print-ready');
    expect(page).toContain("is-print");
    expect(page).not.toContain("player.js");
    expect(page).not.toContain(" hidden");
    expect(page).not.toContain("pdf-link");
    expect(page.match(/<section class="slide/g)?.length).toBe(2);
  });

  it("keeps a PDF link on the live player page", () => {
    const page = renderDeckPage(twoSlides);
    expect(page).toContain('href="/showcase.pdf"');
    expect(page).toContain("player.js");
    expect(page).toContain(" hidden");
  });
});

describe("PdfWorkflow", () => {
  it("renders the print URL and stores the PDF in R2", async () => {
    const r2 = memoryR2();
    const calls: unknown[] = [];
    const points: unknown[] = [];
    const env = {
      BROWSER: {
        quickAction: async (action: string, options: { url: string }) => {
          calls.push({ action, options });
          return new Response(pdfBytes, {
            headers: { "content-type": "application/pdf" },
          });
        },
      },
      R2: r2,
      ANALYTICS: {
        writeDataPoint: (point: unknown) => {
          points.push(point);
        },
      },
    };
    const workflow = new PdfWorkflow({} as ExecutionContext, env as unknown as Env);
    const steps: string[] = [];
    const step = {
      do: async <T>(
        name: string,
        configOrCallback: unknown,
        maybeCallback?: () => Promise<T>,
      ) => {
        steps.push(name);
        const callback =
          typeof configOrCallback === "function"
            ? (configOrCallback as () => Promise<T>)
            : maybeCallback;
        if (!callback) {
          throw new Error(`missing callback for ${name}`);
        }
        return callback();
      },
    };

    const result = await workflow.run(
      {
        payload: {
          slug: "showcase",
          origin: "https://slides.example",
          version: "abc123",
        },
        timestamp: new Date(),
        instanceId: "pdf-showcase-abc123",
      } as never,
      step as never,
    );

    expect(result).toEqual({ ok: true, key: pdfObjectKey("showcase") });
    expect(steps).toEqual(["render-pdf", "put-r2", "purge-cache"]);
    expect(calls).toEqual([
      {
        action: "pdf",
        options: {
          ...PDF_QUICK_ACTION,
          url: "https://slides.example/showcase?print=1",
        },
      },
    ]);
    const stored = await r2.get(pdfObjectKey("showcase"));
    expect(stored?.customMetadata).toEqual({
      version: "abc123",
      slug: "showcase",
    });
    expect(new Uint8Array(await stored!.arrayBuffer())).toEqual(pdfBytes);
    expect(points).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blobs: expect.arrayContaining(["pdf", "complete"]),
        }),
      ]),
    );
  });
});

describe("PDF queue", () => {
  it("starts a durable workflow per job and acks duplicates", async () => {
    const created: unknown[] = [];
    const acks: string[] = [];
    const env = {
      PDF_WORKFLOW: {
        create: async (options: { id: string }) => {
          if (created.some((item) => (item as { id: string }).id === options.id)) {
            throw new Error("instance already exists");
          }
          created.push(options);
          return { id: options.id };
        },
      },
      ANALYTICS: { writeDataPoint: () => undefined },
    };
    const job = {
      slug: "showcase",
      origin: "https://slides.example",
      version: "abc123",
    };
    const message = (id: string) => ({
      id,
      timestamp: new Date(),
      body: job,
      attempts: 1,
      ack: () => {
        acks.push(id);
      },
      retry: () => undefined,
    });

    await handlePdfQueue(
      { messages: [message("m1"), message("m2")] } as never,
      env as unknown as Env,
    );

    expect(created).toEqual([
      {
        id: pdfWorkflowId("showcase", "abc123"),
        params: job,
      },
    ]);
    expect(acks).toEqual(["m1", "m2"]);
  });
});

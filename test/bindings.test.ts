import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function loadWrangler(): Record<string, unknown> {
  const raw = readFileSync("wrangler.jsonc", "utf8");
  const withoutComments = raw.replace(/^\s*\/\/.*$/gm, "");
  return JSON.parse(withoutComments) as Record<string, unknown>;
}

describe("wrangler bindings (TA-813)", () => {
  const config = loadWrangler();

  it("keeps a compatibility date that supports Browser Run quickAction", () => {
    expect(String(config.compatibility_date) >= "2026-03-24").toBe(true);
  });

  it("binds R2 for PDF, figures, and fonts", () => {
    const buckets = config.r2_buckets as Array<Record<string, string>>;
    expect(buckets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          binding: "R2",
          bucket_name: "slides",
        }),
      ]),
    );
  });

  it("binds Browser Run as BROWSER", () => {
    expect(config.browser).toEqual(
      expect.objectContaining({ binding: "BROWSER" }),
    );
  });

  it("binds Images as IMAGES", () => {
    expect(config.images).toEqual(
      expect.objectContaining({ binding: "IMAGES" }),
    );
  });

  it("binds a PDF queue producer without requiring a consumer yet", () => {
    const queues = config.queues as {
      producers?: Array<Record<string, string>>;
      consumers?: unknown[];
    };
    expect(queues.producers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          binding: "PDF_QUEUE",
          queue: "slides-pdf",
        }),
      ]),
    );
    expect(queues.consumers ?? []).toEqual([]);
  });

  it("binds Analytics Engine", () => {
    const datasets = config.analytics_engine_datasets as Array<
      Record<string, string>
    >;
    expect(datasets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          binding: "ANALYTICS",
          dataset: "slides",
        }),
      ]),
    );
  });

  it("registers the PDF Workflow class", () => {
    const workflows = config.workflows as Array<Record<string, string>>;
    expect(workflows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          binding: "PDF_WORKFLOW",
          name: "slides-pdf",
          class_name: "PdfWorkflow",
        }),
      ]),
    );
  });
});

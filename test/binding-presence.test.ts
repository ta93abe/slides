import { describe, expect, it } from "vitest";
import { BINDING_NAMES, bindingPresence } from "../src/bindings.ts";

describe("bindingPresence", () => {
  it("lists every ADR-0007 binding", () => {
    expect([...BINDING_NAMES]).toEqual([
      "ASSETS",
      "R2",
      "BROWSER",
      "IMAGES",
      "PDF_QUEUE",
      "ANALYTICS",
      "PDF_WORKFLOW",
    ]);
  });

  it("reports presence without calling the bindings", () => {
    expect(
      bindingPresence({
        ASSETS: {},
        R2: {},
        BROWSER: {},
        IMAGES: {},
        PDF_QUEUE: {},
        ANALYTICS: {},
        PDF_WORKFLOW: {},
      }),
    ).toEqual({
      ASSETS: true,
      R2: true,
      BROWSER: true,
      IMAGES: true,
      PDF_QUEUE: true,
      ANALYTICS: true,
      PDF_WORKFLOW: true,
    });
  });

  it("treats missing bindings as absent", () => {
    expect(bindingPresence({})).toEqual({
      ASSETS: false,
      R2: false,
      BROWSER: false,
      IMAGES: false,
      PDF_QUEUE: false,
      ANALYTICS: false,
      PDF_WORKFLOW: false,
    });
  });
});

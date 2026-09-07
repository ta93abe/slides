export type PdfJob = {
  slug: string;
  origin: string;
  version: string;
};

export const PDF_PAGE = {
  width: "13.333in",
  height: "7.5in",
} as const;

export const PDF_QUICK_ACTION = {
  cacheTTL: 0,
  emulateMediaType: "print",
  gotoOptions: {
    waitUntil: "networkidle0" as const,
    timeout: 45_000,
  },
  waitForSelector: {
    selector: "[data-print-ready]",
    visible: true as const,
  },
  viewport: {
    width: 1920,
    height: 1080,
  },
  pdfOptions: {
    printBackground: true,
    preferCSSPageSize: true,
    width: PDF_PAGE.width,
    height: PDF_PAGE.height,
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  },
};

export function pdfObjectKey(slug: string): string {
  return `pdf/${slug}.pdf`;
}

export function pdfStagingKey(slug: string, version: string): string {
  return `pdf/${slug}.${version}.partial`;
}

export function pdfWorkflowId(slug: string, version: string): string {
  const id = `pdf-${slug}-${version}`;
  return id.length <= 64 ? id : `pdf-${version}-${slug}`.slice(0, 64);
}

export function printDeckUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/$/, "")}/${slug}?print=1`;
}

export function pdfPublicUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/$/, "")}/${slug}.pdf`;
}

export async function deckVersion(html: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(html),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

export function isAlreadyExistsError(error: unknown): boolean {
  return error instanceof Error && /already exists/i.test(error.message);
}

export function writePdfEvent(
  env: Pick<Env, "ANALYTICS">,
  slug: string,
  status: string,
): void {
  env.ANALYTICS.writeDataPoint({
    indexes: [slug],
    blobs: ["pdf", status],
    doubles: [1],
  });
}

export async function purgePdfCache(url: string): Promise<void> {
  if (typeof caches === "undefined") {
    return;
  }
  await caches.default.delete(url);
}

export function isPrintQuery(value: string | undefined): boolean {
  return value !== undefined && value !== "0" && value !== "false";
}

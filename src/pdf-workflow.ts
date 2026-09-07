import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import {
  PDF_QUICK_ACTION,
  pdfObjectKey,
  pdfPublicUrl,
  pdfStagingKey,
  printDeckUrl,
  purgePdfCache,
  writePdfEvent,
  type PdfJob,
} from "./pdf.ts";

export class PdfWorkflow extends WorkflowEntrypoint<Env, PdfJob> {
  async run(
    event: WorkflowEvent<PdfJob>,
    step: WorkflowStep,
  ): Promise<{ ok: true; key: string }> {
    const { slug, origin, version } = event.payload;
    const key = pdfObjectKey(slug);
    const stagingKey = pdfStagingKey(slug, version);

    await step.do(
      "render-pdf",
      {
        retries: {
          limit: 5,
          delay: "10 seconds",
          backoff: "exponential",
        },
        timeout: "2 minutes",
      },
      async () => {
        const response = await this.env.BROWSER.quickAction("pdf", {
          ...PDF_QUICK_ACTION,
          url: printDeckUrl(origin, slug),
        });
        if (!response.ok) {
          throw new Error(`Browser Run pdf failed: ${response.status}`);
        }
        await this.env.R2.put(stagingKey, await response.arrayBuffer(), {
          httpMetadata: { contentType: "application/pdf" },
          customMetadata: { version, slug },
        });
        return { stagingKey };
      },
    );

    await step.do("put-r2", async () => {
      const object = await this.env.R2.get(stagingKey);
      if (!object) {
        throw new Error(`staging pdf missing: ${stagingKey}`);
      }
      await this.env.R2.put(key, object.body, {
        httpMetadata: { contentType: "application/pdf" },
        customMetadata: { version, slug },
      });
      await this.env.R2.delete(stagingKey);
      return { key };
    });

    await step.do("purge-cache", async () => {
      await purgePdfCache(pdfPublicUrl(origin, slug));
    });

    writePdfEvent(this.env, slug, "complete");
    return { ok: true, key };
  }
}

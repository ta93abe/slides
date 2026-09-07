import {
  isAlreadyExistsError,
  pdfWorkflowId,
  type PdfJob,
} from "./pdf.ts";

export async function handlePdfQueue(
  batch: MessageBatch<PdfJob>,
  env: Env,
): Promise<void> {
  for (const message of batch.messages) {
    const job = message.body;
    try {
      await env.PDF_WORKFLOW.create({
        id: pdfWorkflowId(job.slug, job.version),
        params: job,
      });
    } catch (error) {
      if (!isAlreadyExistsError(error)) {
        throw error;
      }
    }
    message.ack();
  }
}

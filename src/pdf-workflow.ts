import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";

export class PdfWorkflow extends WorkflowEntrypoint<Env> {
  async run(
    _event: WorkflowEvent<Record<string, never>>,
    step: WorkflowStep,
  ): Promise<{ ok: true }> {
    return step.do("registered", async () => ({ ok: true as const }));
  }
}

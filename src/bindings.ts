export const BINDING_NAMES = [
  "ASSETS",
  "R2",
  "BROWSER",
  "IMAGES",
  "PDF_QUEUE",
  "ANALYTICS",
  "PDF_WORKFLOW",
] as const;

export type BindingName = (typeof BINDING_NAMES)[number];

export function bindingPresence(
  env: object,
): Record<BindingName, boolean> {
  const record = env as Record<string, unknown>;
  return Object.fromEntries(
    BINDING_NAMES.map((name) => [name, record[name] != null]),
  ) as Record<BindingName, boolean>;
}

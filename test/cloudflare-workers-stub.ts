export class WorkflowEntrypoint<Env = unknown, Params = unknown> {
  protected env: Env;

  constructor(_ctx: unknown, env: Env) {
    this.env = env;
  }
}

export type WorkflowEvent<T> = {
  payload: T;
  timestamp: Date;
  instanceId: string;
};

export type WorkflowStep = {
  do: <T>(name: string, callback: () => Promise<T>) => Promise<T>;
};

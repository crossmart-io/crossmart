/** Whether a tool only reads (and runs at once) or changes something (and needs approval). */
export enum AgentWorkerToolKind {
  Read = 'read',
  Write = 'write',
}

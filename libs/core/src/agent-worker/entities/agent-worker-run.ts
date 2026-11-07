import type { AgentWorkerTool } from '../tools/agent-worker-toolbox.js';
import type { AgentWorkerScope } from './agent-worker-owner.js';
import type { AgentWorkerEventSink } from './agent-worker-stream.js';

/** One turn as it runs: whose it is, what it may use, where its events go, how it stops. */
export interface AgentWorkerRun {
  scope: AgentWorkerScope;
  turnId: string;
  /** The tools the person's role allows, offered to the model. */
  tools: AgentWorkerTool[];
  sink: AgentWorkerEventSink;
  signal: AbortSignal;
  /** Set once untrusted text read in this turn looked like instructions. */
  untrustedSeen: boolean;
}

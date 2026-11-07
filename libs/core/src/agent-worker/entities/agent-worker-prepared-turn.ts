import type { AgentWorkerTurn } from '@crossmart/database';
import type { AgentWorkerMessageRecord } from '../repositories/agent-worker-message.repository.js';
import type { AgentWorkerDecision } from '../services/agent-worker-decisions.js';
import type { AgentWorkerTool } from '../tools/agent-worker-toolbox.js';
import type { AgentWorkerScope } from './agent-worker-owner.js';

/** A turn that may run: its conversation is claimed and the turn stored, nothing run yet. */
export interface AgentWorkerPreparedTurn {
  scope: AgentWorkerScope;
  turn: AgentWorkerTurn;
  /** The tools the person's role allows. */
  tools: AgentWorkerTool[];
  /** The person's message, for a turn they started by writing. */
  userMessage?: AgentWorkerMessageRecord;
  /** What to make and what to drop, for a turn started by a decision. */
  decision?: AgentWorkerDecision;
}

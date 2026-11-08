import { AGENT_PROPOSAL_TTL_DAYS } from '../../agent-proposals/agent-proposal-ttl.js';
import { HttpMethod } from '../api/api-call.js';
import { AGENT_PROPOSALS_PATH, AgentToolName } from '../agent-tools.constants.js';
import { defineTool } from './api-tool.js';
import { ID_INPUT } from './tool-inputs.js';

/** An outside agent's view of the changes it proposed (ADR 0028). */
export const PROPOSAL_TOOLS = [
  defineTool({
    name: AgentToolName.GetProposal,
    title: 'Check a proposed change',
    description:
      'Where a change you proposed stands. When the workspace asks for approval, write tools ' +
      'do not apply at once: they return a proposal id and wait for the seller. status is ' +
      'pending (waiting), applying, applied (result holds the answer), failed (result holds ' +
      'why), rejected (the seller said no) or expired (nobody decided within ' +
      `${AGENT_PROPOSAL_TTL_DAYS} days). Poll ` +
      'sparingly, such as when the user asks; you can only read your own proposals.',
    input: { proposalId: ID_INPUT.describe('The id a write tool returned') },
    readOnly: true,
    toCall: ({ proposalId }) => ({
      method: HttpMethod.Get,
      path: `${AGENT_PROPOSALS_PATH}/${proposalId}`,
    }),
  }),
];

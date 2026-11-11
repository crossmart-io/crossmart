import { HttpMethod } from '../api/api-call.js';
import { AgentToolName, GETTING_STARTED_PATH } from '../agent-tools.constants.js';
import { defineTool } from './api-tool.js';

export const GETTING_STARTED_TOOLS = [
  defineTool({
    name: AgentToolName.GetStarted,
    title: 'Get started',
    description:
      'Where the account stands and what to do next: counts of products, connected stores ' +
      'and live listings, whether the seller confirmed their email, and the steps to a first ' +
      'listing. Each step has a state (done, todo, blocked) and an owner: "agent" steps you ' +
      'take with the tools named, "merchant" steps only the seller can take, in the Crossmart ' +
      'app at the url given (send them connectStoreLinks to connect a store). Call it first ' +
      'in a new or empty account, and when you are unsure what to do next.',
    input: {},
    readOnly: true,
    toCall: () => ({ method: HttpMethod.Get, path: GETTING_STARTED_PATH }),
  }),
];

import type { AgentWorkerActionRisk } from '../enums/agent-worker-action-risk.enum.js';
import type { AgentWorkerActionStatus } from '../enums/agent-worker-action-status.enum.js';
import type { AgentWorkerRole } from '../enums/agent-worker-role.enum.js';
import type { AgentWorkerToolKind } from '../enums/agent-worker-tool-kind.enum.js';
import type { AgentWorkerTurnStatus } from '../enums/agent-worker-turn-status.enum.js';
import type { AgentWorkerTurnTrigger } from '../enums/agent-worker-turn-trigger.enum.js';

export interface AgentWorkerConversationView {
  id: string;
  title: string;
  /** Changes waiting for the person's approval. */
  pendingActionCount: number;
  lastActivityAt: Date;
  createdAt: Date;
}

export interface AgentWorkerConversationPage {
  items: AgentWorkerConversationView[];
  total: number;
}

/** One thing a proposed change touches: what it is now and what it would become. */
export interface AgentWorkerChange {
  /** What it is, for people: "Title", "Price (Medium)", "On hand". */
  label: string;
  /** Null when the current value is not known. */
  before: string | null;
  after: string | null;
}

/** What a proposed change would do, in plain words, for the approval card. */
export interface AgentWorkerActionPreview {
  /** What it changes, such as "Linen Shirt on Outlet store"; null when unknown. */
  target: string | null;
  /** The change in one sentence: "Add 20 units (stock received)". */
  headline: string;
  /** More lines worth reading before approving, such as the note of an adjustment. */
  details: string[];
  /** Values before and after, for a diff. */
  changes: AgentWorkerChange[];
}

/** The stores and products a tool call is about, as its input names them. */
export interface AgentWorkerActionTargets {
  connectionIds: string[];
  productIds: string[];
}

export interface AgentWorkerActionView {
  id: string;
  messageId: string;
  toolName: string;
  /** The tool's title, such as "Retry publishing a product to a store". */
  toolTitle: string;
  kind: AgentWorkerToolKind;
  status: AgentWorkerActionStatus;
  summary: string;
  risks: AgentWorkerActionRisk[];
  preview: AgentWorkerActionPreview | null;
  /** What it reads or changes, so a map of the workspace can show where the agent works. */
  targets: AgentWorkerActionTargets;
  /** The outcome in one line, once there is one, such as "12 found" or the API's refusal. */
  outcome: string | null;
  isError: boolean;
  /** Untrusted text read in the same turn looked like instructions: review with care. */
  untrustedWarning: boolean;
  decidedAt: Date | null;
  executedAt: Date | null;
  createdAt: Date;
}

export interface AgentWorkerMessageView {
  id: string;
  turnId: string;
  role: AgentWorkerRole;
  text: string;
  actions: AgentWorkerActionView[];
  createdAt: Date;
}

export interface AgentWorkerTurnView {
  id: string;
  trigger: AgentWorkerTurnTrigger;
  status: AgentWorkerTurnStatus;
  modelCalls: number;
  inputTokens: number;
  outputTokens: number;
  failureReason: string | null;
  startedAt: Date;
  finishedAt: Date | null;
}

export interface AgentWorkerConversationDetail {
  conversation: AgentWorkerConversationView;
  messages: AgentWorkerMessageView[];
  /** The turn running now, or waiting for approval; null when the agent is idle. */
  activeTurn: AgentWorkerTurnView | null;
}

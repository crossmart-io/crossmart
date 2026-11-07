import { ApiProperty } from '@nestjs/swagger';
import {
  AgentWorkerActionRisk,
  AgentWorkerActionStatus,
  type AgentWorkerActionPreview,
  type AgentWorkerActionView,
  type AgentWorkerChange,
  type AgentWorkerConversationDetail,
  type AgentWorkerMessageView,
  AgentWorkerRole,
  AgentWorkerToolKind,
  AgentWorkerTurnStatus,
  AgentWorkerTurnTrigger,
  type AgentWorkerTurnView,
} from '@crossmart/core';
import {
  AGENT_WORKER_ACTION_RISK_SCHEMA_NAME,
  AGENT_WORKER_ACTION_STATUS_SCHEMA_NAME,
  AGENT_WORKER_ROLE_SCHEMA_NAME,
  AGENT_WORKER_TOOL_KIND_SCHEMA_NAME,
  AGENT_WORKER_TURN_STATUS_SCHEMA_NAME,
  AGENT_WORKER_TURN_TRIGGER_SCHEMA_NAME,
} from '../agent-worker.constants.js';
import { AgentWorkerConversationDto } from './agent-worker-conversation.dto.js';

export class AgentWorkerChangeDto implements AgentWorkerChange {
  @ApiProperty({ example: 'Price (Medium)', description: 'What changes, for people' })
  label: string;

  @ApiProperty({ type: String, nullable: true, description: 'The value now; null when unknown' })
  before: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'The value after the change' })
  after: string | null;
}

export class AgentWorkerActionPreviewDto implements AgentWorkerActionPreview {
  @ApiProperty({ type: String, nullable: true, example: 'Linen Shirt on Outlet store' })
  target: string | null;

  @ApiProperty({
    example: 'Add 20 units (stock received)',
    description: 'The change in one sentence',
  })
  headline: string;

  @ApiProperty({
    type: [String],
    description: 'More lines to read, such as a note',
    example: ['Note: Spring delivery'],
  })
  details: string[];

  @ApiProperty({ type: [AgentWorkerChangeDto] })
  changes: AgentWorkerChangeDto[];
}

export class AgentWorkerActionDto implements AgentWorkerActionView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  messageId: string;

  @ApiProperty({ example: 'retry_store_listing', description: 'The MCP tool it calls' })
  toolName: string;

  @ApiProperty({ example: 'Retry publishing a product to a store' })
  toolTitle: string;

  @ApiProperty({ enum: AgentWorkerToolKind, enumName: AGENT_WORKER_TOOL_KIND_SCHEMA_NAME })
  kind: AgentWorkerToolKind;

  @ApiProperty({ enum: AgentWorkerActionStatus, enumName: AGENT_WORKER_ACTION_STATUS_SCHEMA_NAME })
  status: AgentWorkerActionStatus;

  @ApiProperty({ example: 'Override or revert fields of a listing: Linen Shirt on Outlet store' })
  summary: string;

  @ApiProperty({
    enum: AgentWorkerActionRisk,
    enumName: AGENT_WORKER_ACTION_RISK_SCHEMA_NAME,
    isArray: true,
    description: 'Why approving it also needs `confirmHighRisk`; empty for ordinary changes',
  })
  risks: AgentWorkerActionRisk[];

  @ApiProperty({ type: AgentWorkerActionPreviewDto, nullable: true })
  preview: AgentWorkerActionPreviewDto | null;

  @ApiProperty({ type: String, nullable: true, example: '12 found' })
  outcome: string | null;

  @ApiProperty()
  isError: boolean;

  @ApiProperty({
    description: 'Text read in the same turn looked like instructions to an AI: review with care',
  })
  untrustedWarning: boolean;

  @ApiProperty({ type: Date, nullable: true })
  decidedAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  executedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  static from(view: AgentWorkerActionView): AgentWorkerActionDto {
    return Object.assign(new AgentWorkerActionDto(), view);
  }
}

export class AgentWorkerMessageDto implements AgentWorkerMessageView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  turnId: string;

  @ApiProperty({ enum: AgentWorkerRole, enumName: AGENT_WORKER_ROLE_SCHEMA_NAME })
  role: AgentWorkerRole;

  @ApiProperty({ description: 'Plain text; the agent may use simple Markdown lists' })
  text: string;

  @ApiProperty({ type: [AgentWorkerActionDto], description: 'Tool calls of this answer' })
  actions: AgentWorkerActionDto[];

  @ApiProperty()
  createdAt: Date;

  static from(view: AgentWorkerMessageView): AgentWorkerMessageDto {
    return Object.assign(new AgentWorkerMessageDto(), {
      ...view,
      actions: view.actions.map((action) => AgentWorkerActionDto.from(action)),
    });
  }
}

export class AgentWorkerTurnDto implements AgentWorkerTurnView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: AgentWorkerTurnTrigger, enumName: AGENT_WORKER_TURN_TRIGGER_SCHEMA_NAME })
  trigger: AgentWorkerTurnTrigger;

  @ApiProperty({ enum: AgentWorkerTurnStatus, enumName: AGENT_WORKER_TURN_STATUS_SCHEMA_NAME })
  status: AgentWorkerTurnStatus;

  @ApiProperty({ description: 'Model calls so far; each uses one AI credit' })
  modelCalls: number;

  @ApiProperty()
  inputTokens: number;

  @ApiProperty()
  outputTokens: number;

  @ApiProperty({ type: String, nullable: true, description: 'Why it failed or stopped early' })
  failureReason: string | null;

  @ApiProperty()
  startedAt: Date;

  @ApiProperty({ type: Date, nullable: true })
  finishedAt: Date | null;

  static from(view: AgentWorkerTurnView): AgentWorkerTurnDto {
    return Object.assign(new AgentWorkerTurnDto(), view);
  }
}

export class AgentWorkerConversationDetailDto implements AgentWorkerConversationDetail {
  @ApiProperty({ type: AgentWorkerConversationDto })
  conversation: AgentWorkerConversationDto;

  @ApiProperty({ type: [AgentWorkerMessageDto], description: 'Oldest first' })
  messages: AgentWorkerMessageDto[];

  @ApiProperty({
    type: AgentWorkerTurnDto,
    nullable: true,
    description: 'The turn running or waiting for approval; null when the agent is idle',
  })
  activeTurn: AgentWorkerTurnDto | null;

  static from(detail: AgentWorkerConversationDetail): AgentWorkerConversationDetailDto {
    return Object.assign(new AgentWorkerConversationDetailDto(), {
      conversation: AgentWorkerConversationDto.from(detail.conversation),
      messages: detail.messages.map((message) => AgentWorkerMessageDto.from(message)),
      activeTurn: detail.activeTurn ? AgentWorkerTurnDto.from(detail.activeTurn) : null,
    });
  }
}

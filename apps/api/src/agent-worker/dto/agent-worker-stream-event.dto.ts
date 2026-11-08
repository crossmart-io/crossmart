import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AgentWorkerErrorCode,
  type AgentWorkerErrorView,
  AgentWorkerEventType,
  type AgentWorkerStreamEvent,
} from '@crossmart/core';
import {
  AGENT_WORKER_ERROR_CODE_SCHEMA_NAME,
  AGENT_WORKER_EVENT_TYPE_SCHEMA_NAME,
} from '../agent-worker.constants.js';
import {
  AgentWorkerActionDto,
  AgentWorkerMessageDto,
  AgentWorkerTurnDto,
} from './agent-worker-message.dto.js';

export class AgentWorkerErrorDto implements AgentWorkerErrorView {
  @ApiProperty({ enum: AgentWorkerErrorCode, enumName: AGENT_WORKER_ERROR_CODE_SCHEMA_NAME })
  code: AgentWorkerErrorCode;

  @ApiProperty({ description: 'Safe to show to the person' })
  message: string;
}

/** One server-sent event of a turn. `type` says which of the other fields it carries. */
export class AgentWorkerStreamEventDto implements AgentWorkerStreamEvent {
  @ApiProperty({ enum: AgentWorkerEventType, enumName: AGENT_WORKER_EVENT_TYPE_SCHEMA_NAME })
  type: AgentWorkerEventType;

  @ApiPropertyOptional({ type: AgentWorkerTurnDto, description: 'turn_started, turn_finished' })
  turn?: AgentWorkerTurnDto;

  @ApiPropertyOptional({ description: 'text_delta: the next piece of the answer' })
  delta?: string;

  @ApiPropertyOptional({ type: AgentWorkerMessageDto, description: 'message' })
  message?: AgentWorkerMessageDto;

  @ApiPropertyOptional({
    type: AgentWorkerActionDto,
    description: 'tool_started, tool_finished, action_proposed, action_decided',
  })
  action?: AgentWorkerActionDto;

  @ApiPropertyOptional({ type: AgentWorkerErrorDto, description: 'error' })
  error?: AgentWorkerErrorDto;

  static from(event: AgentWorkerStreamEvent): AgentWorkerStreamEventDto {
    return Object.assign(new AgentWorkerStreamEventDto(), {
      ...event,
      ...(event.turn ? { turn: AgentWorkerTurnDto.from(event.turn) } : {}),
      ...(event.message ? { message: AgentWorkerMessageDto.from(event.message) } : {}),
      ...(event.action ? { action: AgentWorkerActionDto.from(event.action) } : {}),
    });
  }
}

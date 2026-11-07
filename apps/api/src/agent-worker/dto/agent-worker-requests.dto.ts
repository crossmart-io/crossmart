import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  AGENT_WORKER_MESSAGE_MAX_LENGTH,
  AGENT_WORKER_MESSAGE_MIN_LENGTH,
  AgentWorkerContextView,
  type AgentWorkerPageContext,
} from '@crossmart/core';
import { AGENT_WORKER_CONTEXT_VIEW_SCHEMA_NAME } from '../agent-worker.constants.js';

/** Decisions name at most this many actions; one answer proposes far fewer. */
const MAX_DECIDED_ACTIONS = 100;

export class AgentWorkerPageContextDto implements AgentWorkerPageContext {
  @ApiPropertyOptional({
    enum: AgentWorkerContextView,
    enumName: AGENT_WORKER_CONTEXT_VIEW_SCHEMA_NAME,
    description: 'The page the person wrote from',
  })
  @IsOptional()
  @IsEnum(AgentWorkerContextView)
  view?: AgentWorkerContextView;

  @ApiPropertyOptional({ format: 'uuid', description: 'The product on screen' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'The store on screen' })
  @IsOptional()
  @IsUUID()
  connectionId?: string;
}

export class SendAgentWorkerMessageDto {
  @ApiProperty({
    minLength: AGENT_WORKER_MESSAGE_MIN_LENGTH,
    maxLength: AGENT_WORKER_MESSAGE_MAX_LENGTH,
    example: 'Fix my failed eBay listings',
  })
  @IsString()
  @MinLength(AGENT_WORKER_MESSAGE_MIN_LENGTH)
  @MaxLength(AGENT_WORKER_MESSAGE_MAX_LENGTH)
  text: string;

  @ApiPropertyOptional({
    type: AgentWorkerPageContextDto,
    description: 'Where the person is in the app, so "this product" means something',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AgentWorkerPageContextDto)
  context?: AgentWorkerPageContextDto;
}

export class DecideAgentWorkerActionsDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description:
      'The waiting actions to approve; every other waiting action of the conversation is ' +
      'rejected. Empty rejects them all.',
  })
  @IsArray()
  @ArrayMaxSize(MAX_DECIDED_ACTIONS)
  @IsUUID('all', { each: true })
  approvedActionIds: string[];

  @ApiPropertyOptional({
    default: false,
    description:
      'Required (true) to approve an action with `risks`: a deletion, a price change or a bulk change',
  })
  @IsOptional()
  @IsBoolean()
  confirmHighRisk?: boolean;
}

export class AgentWorkerCancelResultDto {
  @ApiProperty({ description: 'False when no turn was running' })
  cancelled: boolean;
}

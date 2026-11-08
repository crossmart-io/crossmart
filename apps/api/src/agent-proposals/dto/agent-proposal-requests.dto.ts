import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  AGENT_PROPOSAL_DEFAULT_PAGE_SIZE,
  AGENT_PROPOSAL_MAX_PAGE_SIZE,
  type AgentProposalListQuery,
  type AgentProposalRequest,
  AgentProposalStatus,
} from '@crossmart/core';
import { PageNumberProperty } from '../../common/page-number.decorator.js';
import { AGENT_PROPOSAL_STATUS_SCHEMA_NAME } from '../agent-proposals.constants.js';

const FIRST_PAGE = 1;
/** Tool names are short snake_case words. */
const TOOL_NAME_MAX_LENGTH = 100;

/** The route parameters that name one proposal in a workspace. */
export class AgentProposalParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  workspaceId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  proposalId: string;
}

/** A write tool call an outside agent sends to be proposed. */
export class ProposeAgentChangeDto implements AgentProposalRequest {
  @ApiProperty({
    example: 'update_variant_price',
    maxLength: TOOL_NAME_MAX_LENGTH,
    description: 'An MCP write tool, as the MCP server lists it',
  })
  @IsString()
  @MaxLength(TOOL_NAME_MAX_LENGTH)
  tool: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { productId: '0193…', variantId: '0193…', price: '19.00' },
    description: "The tool's input, as its MCP schema describes it",
  })
  @IsObject()
  input: Record<string, unknown>;
}

export class DecideAgentProposalDto {
  @ApiPropertyOptional({
    default: false,
    description: 'Required for a proposal with risks (deletes, changes prices, or many items)',
  })
  @IsOptional()
  @IsBoolean()
  confirmHighRisk?: boolean;
}

export class ListAgentProposalsQueryDto implements Partial<AgentProposalListQuery> {
  @ApiPropertyOptional({ enum: AgentProposalStatus, enumName: AGENT_PROPOSAL_STATUS_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(AgentProposalStatus)
  status?: AgentProposalStatus;

  @PageNumberProperty()
  page?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: AGENT_PROPOSAL_MAX_PAGE_SIZE,
    default: AGENT_PROPOSAL_DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(AGENT_PROPOSAL_MAX_PAGE_SIZE)
  limit?: number;

  toQuery(): AgentProposalListQuery {
    return {
      status: this.status,
      page: this.page ?? FIRST_PAGE,
      limit: this.limit ?? AGENT_PROPOSAL_DEFAULT_PAGE_SIZE,
    };
  }
}

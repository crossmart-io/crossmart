import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import {
  AGENT_WORKER_DEFAULT_PAGE_SIZE,
  AGENT_WORKER_MAX_PAGE_SIZE,
  AGENT_WORKER_TITLE_MAX_LENGTH,
  type AgentWorkerConversationPage,
  type AgentWorkerConversationQuery,
  type AgentWorkerConversationView,
} from '@crossmart/core';
import { PageNumberProperty } from '../../common/page-number.decorator.js';

const FIRST_PAGE = 1;

export class CreateAgentWorkerConversationDto {
  @ApiPropertyOptional({
    maxLength: AGENT_WORKER_TITLE_MAX_LENGTH,
    description: 'Taken from the first message when left out',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(AGENT_WORKER_TITLE_MAX_LENGTH)
  title?: string;
}

export class ListAgentWorkerConversationsQueryDto implements Partial<AgentWorkerConversationQuery> {
  @PageNumberProperty()
  page?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: AGENT_WORKER_MAX_PAGE_SIZE,
    default: AGENT_WORKER_DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(AGENT_WORKER_MAX_PAGE_SIZE)
  limit?: number;

  toQuery(): AgentWorkerConversationQuery {
    return { page: this.page ?? FIRST_PAGE, limit: this.limit ?? AGENT_WORKER_DEFAULT_PAGE_SIZE };
  }
}

export class AgentWorkerConversationDto implements AgentWorkerConversationView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Fix my failed eBay listings' })
  title: string;

  @ApiProperty({ description: 'Changes waiting for approval' })
  pendingActionCount: number;

  @ApiProperty()
  lastActivityAt: Date;

  @ApiProperty()
  createdAt: Date;

  static from(view: AgentWorkerConversationView): AgentWorkerConversationDto {
    return Object.assign(new AgentWorkerConversationDto(), view);
  }
}

export class AgentWorkerConversationPageDto {
  @ApiProperty({ type: [AgentWorkerConversationDto], description: 'Most recently active first' })
  items: AgentWorkerConversationDto[];

  @ApiProperty()
  total: number;

  static from(page: AgentWorkerConversationPage): AgentWorkerConversationPageDto {
    return Object.assign(new AgentWorkerConversationPageDto(), {
      items: page.items.map((item) => AgentWorkerConversationDto.from(item)),
      total: page.total,
    });
  }
}

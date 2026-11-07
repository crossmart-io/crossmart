import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AskEscalationsService, AskInsightsService } from '@crossmart/core';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { PlatformAdminGuard } from '../../auth/guards/platform-admin.guard.js';
import { requireUser } from '../../auth/principal.utils.js';
import {
  ASK_ADMIN_CONVERSATION_ID_PARAM,
  ASK_ADMIN_ESCALATION_ID_PARAM,
  ASK_ADMIN_ROUTE,
  ASK_ADMIN_TAG,
} from '../ask.constants.js';
import {
  AskQuestionCountQueryDto,
  ListAskConversationsQueryDto,
  ListAskEscalationsQueryDto,
} from '../dto/ask-admin-query.dto.js';
import {
  AskConversationDetailDto,
  AskConversationPageDto,
  AskEscalationRecordDto,
  AskQuestionCountDto,
  ReplyAskEscalationDto,
} from '../dto/ask-admin.dto.js';

const NOT_AN_ADMIN = 'Not a platform admin (404 for everyone else)';

/**
 * What people ask Ask Crossmart, for the platform admins only (`PLATFORM_ADMIN_EMAILS`, ADR
 * 0025): stored conversations, the questions asked most and the ones it could not answer, and
 * replies to escalations. Everyone else gets 404.
 */
@ApiTags(ASK_ADMIN_TAG)
@ApiCookieAuth()
@Controller(ASK_ADMIN_ROUTE)
@UseGuards(PlatformAdminGuard)
export class AskAdminController {
  constructor(
    private readonly insights: AskInsightsService,
    private readonly escalations: AskEscalationsService,
  ) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Stored conversations, newest first' })
  @ApiOkResponse({ type: AskConversationPageDto })
  @ApiNotFoundResponse({ description: NOT_AN_ADMIN })
  async conversations(
    @Query() query: ListAskConversationsQueryDto,
  ): Promise<AskConversationPageDto> {
    return AskConversationPageDto.from(await this.insights.conversations(query));
  }

  @Get(`conversations/:${ASK_ADMIN_CONVERSATION_ID_PARAM}`)
  @ApiOperation({ summary: 'One conversation, with every question, answer and escalation' })
  @ApiOkResponse({ type: AskConversationDetailDto })
  @ApiNotFoundResponse({ description: NOT_AN_ADMIN })
  async conversation(
    @Param(ASK_ADMIN_CONVERSATION_ID_PARAM, ParseUUIDPipe) conversationId: string,
  ): Promise<AskConversationDetailDto> {
    return AskConversationDetailDto.fromDetail(await this.insights.conversation(conversationId));
  }

  @Get('questions/top')
  @ApiOperation({ summary: 'The questions asked most' })
  @ApiOkResponse({ type: [AskQuestionCountDto] })
  async topQuestions(@Query() query: AskQuestionCountQueryDto): Promise<AskQuestionCountDto[]> {
    const counts = await this.insights.topQuestions(query);
    return counts.map((count) => AskQuestionCountDto.from(count));
  }

  @Get('questions/unanswered')
  @ApiOperation({
    summary: 'The questions Ask did not answer, or answered unsure, most asked first',
  })
  @ApiOkResponse({ type: [AskQuestionCountDto] })
  async unansweredQuestions(
    @Query() query: AskQuestionCountQueryDto,
  ): Promise<AskQuestionCountDto[]> {
    const counts = await this.insights.unansweredQuestions(query);
    return counts.map((count) => AskQuestionCountDto.from(count));
  }

  @Get('escalations')
  @ApiOperation({ summary: 'Escalations, newest first' })
  @ApiOkResponse({ type: [AskEscalationRecordDto] })
  async escalationList(
    @Query() query: ListAskEscalationsQueryDto,
  ): Promise<AskEscalationRecordDto[]> {
    const records = await this.escalations.list(query.status, query.limit);
    return records.map((record) => AskEscalationRecordDto.from(record));
  }

  @Post(`escalations/:${ASK_ADMIN_ESCALATION_ID_PARAM}/reply`)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reply to an escalation',
    description:
      'Stores the reply once, emails it to the contact email, and POSTs it, signed, to the ' +
      'callback URL; the asker can also read it with their ticket id.',
  })
  @ApiOkResponse({ type: AskEscalationRecordDto })
  @ApiConflictResponse({ description: 'Another admin replied first' })
  async reply(
    @Param(ASK_ADMIN_ESCALATION_ID_PARAM, ParseUUIDPipe) escalationId: string,
    @Body() body: ReplyAskEscalationDto,
    @CurrentPrincipal() principal: Principal,
  ): Promise<AskEscalationRecordDto> {
    const record = await this.escalations.reply({
      escalationId,
      reply: body.reply,
      repliedBy: requireUser(principal).email,
    });
    return AskEscalationRecordDto.from(record);
  }
}

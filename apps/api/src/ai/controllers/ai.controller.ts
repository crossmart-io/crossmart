import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  type Actor,
  AiGateway,
  type AiUsagePeriod,
  AiUsageService,
  ContentGenerationService,
  WorkspacePermission,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  AI_ROUTE,
  AI_STATUS_PATH,
  AI_TAG,
  AI_USAGE_PATH,
  CONTENT_GENERATIONS_PATH,
} from '../ai.constants.js';
import { AiStatusDto } from '../dto/ai-status.dto.js';
import { AiUsageQueryDto, AiUsageReportDto } from '../dto/ai-usage.dto.js';
import { ContentGenerationReceiptDto, GenerateContentDto } from '../dto/content-generation.dto.js';

const PERIOD_INCOMPLETE = 'Give both from and to, or neither';
const PERIOD_REVERSED = 'from must be before to';

/** The AI agents: whether they are available, what they used, and asking them for content. */
@ApiTags(AI_TAG)
@Controller(AI_ROUTE)
export class AiController {
  constructor(
    private readonly ai: AiGateway,
    private readonly usage: AiUsageService,
    private readonly contentGeneration: ContentGenerationService,
  ) {}

  @Get(AI_STATUS_PATH)
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({ summary: 'Whether AI features are available on this server' })
  @ApiParam({ name: WORKSPACE_ID_PARAM, format: 'uuid' })
  @ApiOkResponse({ type: AiStatusDto })
  status(): AiStatusDto {
    return AiStatusDto.from(this.ai.status());
  }

  @Get(AI_USAGE_PATH)
  @RequirePermission(WorkspacePermission.ViewReports)
  @ApiOperation({
    summary: 'AI calls and tokens used by the workspace',
    description: 'Per feature and model, in a period; the current UTC month by default.',
  })
  @ApiOkResponse({ type: AiUsageReportDto })
  async usageReport(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Query() query: AiUsageQueryDto,
  ): Promise<AiUsageReportDto> {
    return AiUsageReportDto.from(await this.usage.report(workspaceId, this.periodOf(query)));
  }

  @Post(CONTENT_GENERATIONS_PATH)
  @HttpCode(HttpStatus.ACCEPTED)
  @RequirePermission(WorkspacePermission.GenerateContent)
  @ApiOperation({
    summary: 'Generate channel content with AI',
    description:
      'Queues the Content Generator for each product: it writes a title and description ' +
      'fitted to the store’s channel. The results arrive as pending suggestions to review; ' +
      'nothing changes until one is approved. Answers 503 while AI is not configured.',
  })
  @ApiAcceptedResponse({ type: ContentGenerationReceiptDto })
  async generateContent(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Body() body: GenerateContentDto,
    @CurrentActor() actor: Actor,
  ): Promise<ContentGenerationReceiptDto> {
    const receipt = await this.contentGeneration.request(
      { workspaceId, connectionId: body.connectionId, productIds: body.productIds },
      actor,
    );
    return ContentGenerationReceiptDto.from(receipt);
  }

  private periodOf({ from, to }: AiUsageQueryDto): AiUsagePeriod | undefined {
    if (!from && !to) return undefined;
    if (!from || !to) throw new BadRequestException(PERIOD_INCOMPLETE);
    if (from >= to) throw new BadRequestException(PERIOD_REVERSED);
    return { from, to };
  }
}

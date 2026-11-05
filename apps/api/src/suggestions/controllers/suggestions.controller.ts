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
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type Actor,
  SuggestionReviewService,
  SuggestionsService,
  WorkspacePermission,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { BulkApproveSuggestionsDto, BulkReviewResultDto } from '../dto/bulk-approve.dto.js';
import { ListSuggestionsQueryDto } from '../dto/list-suggestions-query.dto.js';
import { SuggestionDto, SuggestionPageDto } from '../dto/suggestion.dto.js';
import { SuggestionParamsDto } from '../dto/suggestion-params.dto.js';
import {
  APPROVE_PATH,
  BULK_APPROVE_PATH,
  REJECT_PATH,
  SUGGESTION_PATH,
  SUGGESTIONS_ROUTE,
  SUGGESTIONS_TAG,
} from '../suggestions.constants.js';

/** The suggestions inbox: what agents propose, and approving or rejecting it. */
@ApiTags(SUGGESTIONS_TAG)
@Controller(SUGGESTIONS_ROUTE)
export class SuggestionsController {
  constructor(
    private readonly suggestions: SuggestionsService,
    private readonly reviews: SuggestionReviewService,
  ) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewSuggestions)
  @ApiOperation({
    summary: 'Suggestions, newest first',
    description: 'Filter by `PENDING` for the inbox.',
  })
  @ApiOkResponse({ type: SuggestionPageDto })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Query() query: ListSuggestionsQueryDto,
  ): Promise<SuggestionPageDto> {
    return SuggestionPageDto.from(await this.suggestions.list(workspaceId, query));
  }

  @Post(BULK_APPROVE_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.ApproveSuggestions)
  @ApiOperation({
    summary: 'Approve several suggestions',
    description:
      'Applies each pending suggestion, or marks it `STALE` when its field changed since it ' +
      'was made. Suggestions that are not pending are skipped.',
  })
  @ApiOkResponse({ type: BulkReviewResultDto })
  async bulkApprove(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Body() body: BulkApproveSuggestionsDto,
    @CurrentActor() actor: Actor,
  ): Promise<BulkReviewResultDto> {
    const result = await this.reviews.bulkApprove({
      workspaceId,
      suggestionIds: body.suggestionIds,
      actor,
    });
    return BulkReviewResultDto.from(result);
  }

  @Get(SUGGESTION_PATH)
  @RequirePermission(WorkspacePermission.ViewSuggestions)
  @ApiOperation({ summary: 'One suggestion' })
  @ApiOkResponse({ type: SuggestionDto })
  async get(@Param() ref: SuggestionParamsDto): Promise<SuggestionDto> {
    return SuggestionDto.from(await this.suggestions.get(ref));
  }

  @Post(APPROVE_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.ApproveSuggestions)
  @ApiOperation({
    summary: 'Approve a suggestion',
    description:
      'Applies the change the way an edit would (a channel override, synced to the store), ' +
      'and returns it `APPLIED`. When its field changed since it was made, nothing is applied ' +
      'and it returns `STALE`. A suggestion that is no longer pending answers 409.',
  })
  @ApiOkResponse({ type: SuggestionDto })
  async approve(
    @Param() ref: SuggestionParamsDto,
    @CurrentActor() actor: Actor,
  ): Promise<SuggestionDto> {
    return SuggestionDto.from(await this.reviews.approve(ref, actor));
  }

  @Post(REJECT_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.ApproveSuggestions)
  @ApiOperation({
    summary: 'Reject a suggestion',
    description: 'Nothing is changed. A suggestion that is no longer pending answers 409.',
  })
  @ApiOkResponse({ type: SuggestionDto })
  async reject(
    @Param() ref: SuggestionParamsDto,
    @CurrentActor() actor: Actor,
  ): Promise<SuggestionDto> {
    return SuggestionDto.from(await this.reviews.reject(ref, actor));
  }
}

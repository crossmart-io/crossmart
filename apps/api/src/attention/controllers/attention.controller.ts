import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AttentionSection,
  AttentionService,
  type ResolvedRole,
  WorkspacePermission,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { CurrentWorkspaceAccess } from '../../auth/decorators/workspace-access.decorator.js';
import {
  ATTENTION_ROUTE,
  ATTENTION_SECTION_PERMISSIONS,
  ATTENTION_TAG,
} from '../attention.constants.js';
import { AttentionQueryDto } from '../dto/attention-query.dto.js';
import { AttentionSummaryDto } from '../dto/attention-summary.dto.js';

/** The sections the caller's permissions open. */
function visibleSections(access: ResolvedRole): Set<AttentionSection> {
  return new Set(
    Object.values(AttentionSection).filter((section) =>
      access.permissions.has(ATTENTION_SECTION_PERMISSIONS[section]),
    ),
  );
}

@ApiTags(ATTENTION_TAG)
@Controller(ATTENTION_ROUTE)
export class AttentionController {
  constructor(private readonly attention: AttentionService) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({
    summary: 'What needs the merchant now',
    description:
      'Stores to reconnect, failed listings, outside agents’ proposals and AI suggestions ' +
      'waiting for review: a count and the latest few of each, for Home and a sidebar badge. ' +
      'Counts match the Channels, Agent proposals and Suggestions pages. A section is null ' +
      'without the permission its page needs (`channels:view` or `suggestions:view`).',
  })
  @ApiOkResponse({ type: AttentionSummaryDto })
  async get(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Query() query: AttentionQueryDto,
    @CurrentWorkspaceAccess() access: ResolvedRole,
  ): Promise<AttentionSummaryDto> {
    const sections = visibleSections(access);
    const summary = await this.attention.summary(workspaceId, { sections, limit: query.limit });
    return AttentionSummaryDto.from(summary);
  }
}

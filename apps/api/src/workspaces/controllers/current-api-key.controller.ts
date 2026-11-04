import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { requireApiKey } from '../../auth/principal.utils.js';
import { CurrentApiKeyDto } from '../dto/current-api-key.dto.js';
import { API_KEYS_TAG, CURRENT_API_KEY_ROUTE } from '../workspaces.constants.js';

@ApiTags(API_KEYS_TAG)
@Controller(CURRENT_API_KEY_ROUTE)
export class CurrentApiKeyController {
  @Get()
  @ApiOperation({
    summary: 'The API key making this request',
    description: 'Lets a program, such as the MCP server, find the workspace its key works in.',
  })
  @ApiOkResponse({ type: CurrentApiKeyDto })
  get(@CurrentPrincipal() principal: Principal): CurrentApiKeyDto {
    return CurrentApiKeyDto.from(requireApiKey(principal));
  }
}

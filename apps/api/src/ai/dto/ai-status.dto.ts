import { ApiProperty } from '@nestjs/swagger';
import type { AiStatus } from '@crossmart/core';

/** Whether AI features can run, so clients show them or the "not configured" state. */
export class AiStatusDto implements AiStatus {
  @ApiProperty({ description: 'False until the server has an AI provider key' })
  configured: boolean;

  @ApiProperty({ example: 'anthropic' })
  provider: string;

  @ApiProperty({ example: 'claude-sonnet-5-5' })
  model: string;

  static from(status: AiStatus): AiStatusDto {
    return Object.assign(new AiStatusDto(), status);
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { type SandboxOpening, SandboxOpeningOutcome } from '@crossmart/core';
import {
  SANDBOX_CREATED_NEXT_STEP,
  SANDBOX_OPENING_OUTCOME_SCHEMA_NAME,
  SANDBOX_SIGN_IN_NEXT_STEP,
} from '../sandbox.constants.js';

/** What `create_account` answers. The fields beyond `outcome` and `nextStep` are set on creation. */
export class SandboxAccountDto {
  @ApiProperty({ enum: SandboxOpeningOutcome, enumName: SANDBOX_OPENING_OUTCOME_SCHEMA_NAME })
  outcome: SandboxOpeningOutcome;

  @ApiProperty({ description: 'What the agent should do next' })
  nextStep: string;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  workspaceId: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'An Editor API key for the new workspace, shown only now. Send it as ' +
      '`Authorization: Bearer <key>` or `x-api-key`.',
  })
  apiKey: string | null;

  @ApiProperty({
    type: Date,
    nullable: true,
    description: 'When the claim link stops working and the unclaimed account is deleted',
  })
  claimExpiresAt: Date | null;

  static from(opening: SandboxOpening): SandboxAccountDto {
    if (opening.outcome === SandboxOpeningOutcome.SignInRequired) {
      return Object.assign(new SandboxAccountDto(), {
        outcome: opening.outcome,
        nextStep: SANDBOX_SIGN_IN_NEXT_STEP,
        workspaceId: null,
        apiKey: null,
        claimExpiresAt: null,
      });
    }
    return Object.assign(new SandboxAccountDto(), opening, { nextStep: SANDBOX_CREATED_NEXT_STEP });
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import type { ClaimedSandbox, SandboxClaimPreview } from '@crossmart/core';
import { MIN_PASSWORD_LENGTH } from '../../auth/auth.constants.js';
import { CLAIM_TOKEN_MAX_LENGTH, PASSWORD_MAX_LENGTH } from '../sandbox.constants.js';

/** The secret from the claim link. Sent in the body, so it stays out of URLs and logs. */
export class SandboxClaimTokenDto {
  @ApiProperty({ maxLength: CLAIM_TOKEN_MAX_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(CLAIM_TOKEN_MAX_LENGTH)
  token: string;
}

export class ClaimSandboxDto extends SandboxClaimTokenDto {
  @ApiProperty({
    minLength: MIN_PASSWORD_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
    description: 'The password the person signs in with from now on',
  })
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;
}

export class SandboxClaimPreviewDto {
  @ApiProperty({ format: 'uuid' })
  workspaceId: string;

  @ApiProperty({ description: 'The address the account is for; the person signs in with it' })
  email: string;

  @ApiProperty()
  storeName: string;

  @ApiProperty({ description: 'When the link stops working and the account is deleted' })
  claimExpiresAt: Date;

  @ApiProperty({
    description:
      'True when the person already has a password: they sign in and claim from the app ' +
      'instead of choosing one',
  })
  passwordSet: boolean;

  static from(preview: SandboxClaimPreview): SandboxClaimPreviewDto {
    return Object.assign(new SandboxClaimPreviewDto(), preview);
  }
}

export class ClaimedSandboxDto {
  @ApiProperty({ format: 'uuid' })
  workspaceId: string;

  @ApiProperty({ description: 'The address to sign in with' })
  email: string;

  static from({ workspaceId, email }: ClaimedSandbox): ClaimedSandboxDto {
    return Object.assign(new ClaimedSandboxDto(), { workspaceId, email });
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { AcceptedInvitation, InvitationPreview, InvitationSummary } from '@crossmart/core';
import { WorkspaceRole } from '@crossmart/database';
import {
  INVITATION_TOKEN_MAX_LENGTH,
  WORKSPACE_ROLE_SCHEMA_NAME,
} from '../workspaces.constants.js';

export class InvitationDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: WorkspaceRole, enumName: WORKSPACE_ROLE_SCHEMA_NAME })
  role: WorkspaceRole;

  @ApiProperty()
  invitedByName: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;

  static from(invitation: InvitationSummary): InvitationDto {
    return Object.assign(new InvitationDto(), invitation);
  }
}

/** The secret from the invitation link. Sent in the body, so it stays out of URLs and logs. */
export class InvitationTokenDto {
  @ApiProperty({ maxLength: INVITATION_TOKEN_MAX_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(INVITATION_TOKEN_MAX_LENGTH)
  token: string;
}

export class InvitationPreviewDto {
  @ApiProperty({ description: "The workspace's display name" })
  workspaceName: string;

  @ApiProperty()
  inviterName: string;

  @ApiProperty({ description: 'The address invited; accepting needs an account with it' })
  email: string;

  @ApiProperty({ enum: WorkspaceRole, enumName: WORKSPACE_ROLE_SCHEMA_NAME })
  role: WorkspaceRole;

  @ApiProperty()
  expiresAt: Date;

  static from(preview: InvitationPreview): InvitationPreviewDto {
    return Object.assign(new InvitationPreviewDto(), preview);
  }
}

export class AcceptedInvitationDto {
  @ApiProperty({ format: 'uuid' })
  workspaceId: string;

  @ApiProperty({ enum: WorkspaceRole, enumName: WORKSPACE_ROLE_SCHEMA_NAME })
  role: WorkspaceRole;

  static from(accepted: AcceptedInvitation): AcceptedInvitationDto {
    return Object.assign(new AcceptedInvitationDto(), accepted);
  }
}

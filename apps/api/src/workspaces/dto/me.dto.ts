import { ApiProperty } from '@nestjs/swagger';
import type { WorkspaceAccess } from '@crossmart/core';
import type { UserPrincipal } from '../../auth/entities/principal.js';
import { WorkspaceDto } from './workspace.dto.js';

export class MeDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ type: [WorkspaceDto] })
  workspaces: WorkspaceDto[];

  @ApiProperty({
    description:
      'Whether the user runs this instance (`PLATFORM_ADMIN_EMAILS`, verified): they can read ' +
      'Ask Crossmart’s conversations and answer escalations',
  })
  platformAdmin: boolean;

  static from(user: UserPrincipal, workspaces: WorkspaceAccess[], platformAdmin: boolean): MeDto {
    return Object.assign(new MeDto(), {
      id: user.userId,
      name: user.name,
      email: user.email,
      workspaces: workspaces.map((workspace) => WorkspaceDto.from(workspace)),
      platformAdmin,
    });
  }
}

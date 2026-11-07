import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { WORKSPACE_NAME_MAX_LENGTH } from '../../workspaces/workspaces.constants.js';
import { EMAIL_MAX_LENGTH } from '../sandbox.constants.js';

function trimmed({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateSandboxAccountDto {
  @ApiProperty({
    maxLength: EMAIL_MAX_LENGTH,
    example: 'ana@example.com',
    description: 'The person the account is for. The claim link goes to this address.',
  })
  @Transform(trimmed)
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  email: string;

  @ApiProperty({
    maxLength: WORKSPACE_NAME_MAX_LENGTH,
    example: 'Ana Ceramics',
    description: 'What to call the store; the person can rename it later',
  })
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  @MaxLength(WORKSPACE_NAME_MAX_LENGTH)
  storeName: string;
}

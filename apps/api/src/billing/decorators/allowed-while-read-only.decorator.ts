import { SetMetadata } from '@nestjs/common';
import { ALLOWED_WHILE_READ_ONLY_METADATA_KEY } from '../billing.constants.js';

/**
 * Keeps a write route open to a read-only organization (ADR 0024), for actions that take access
 * away or remove data, such as revoking an API key or deleting a workspace.
 */
export const AllowedWhileReadOnly = (): MethodDecorator & ClassDecorator =>
  SetMetadata(ALLOWED_WHILE_READ_ONLY_METADATA_KEY, true);

import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_METADATA_KEY } from '../auth.constants.js';

/** Opens a route to anonymous callers. Every other route requires a session or an API key. */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_METADATA_KEY, true);

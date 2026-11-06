import { SetMetadata } from '@nestjs/common';
import { ALLOWS_ANONYMOUS_METADATA_KEY } from '../auth.constants.js';

/**
 * Opens a route to anonymous callers while still identifying those who send a session or an
 * API key, so the route can treat them differently (such as a higher rate limit). A wrong API
 * key is refused rather than treated as anonymous.
 */
export const AllowAnonymous = (): MethodDecorator & ClassDecorator =>
  SetMetadata(ALLOWS_ANONYMOUS_METADATA_KEY, true);

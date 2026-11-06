import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';
import type { Request } from 'express';
import { corsPolicy, isPublicCorsPath } from './cors-policy.js';
import { PUBLIC_CORS_OPTIONS } from './cors.constants.js';

const TRUSTED = ['https://app.crossmart.io'];

function optionsFor(path: string): CorsOptions | undefined {
  let chosen: CorsOptions | undefined;
  corsPolicy(TRUSTED)({ path } as Request, (_error, options) => {
    chosen = options;
  });
  return chosen;
}

describe('corsPolicy', () => {
  it('opens Ask to any origin without credentials', () => {
    expect(isPublicCorsPath('/api/v1/ask')).toBe(true);
    expect(isPublicCorsPath('/api/v1/ask/')).toBe(true);
    expect(optionsFor('/api/v1/ask')).toBe(PUBLIC_CORS_OPTIONS);
    expect(PUBLIC_CORS_OPTIONS.credentials).toBe(false);
  });

  it('keeps every other route to the trusted origins, with credentials', () => {
    expect(isPublicCorsPath('/api/v1/asks')).toBe(false);
    expect(isPublicCorsPath('/api/v1/me')).toBe(false);
    expect(optionsFor('/api/v1/me')).toEqual({ origin: TRUSTED, credentials: true });
  });
});

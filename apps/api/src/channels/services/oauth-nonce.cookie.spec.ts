import type { Request, Response } from 'express';
import type { AppConfigService } from '@crossmart/common';
import { ChannelType } from '@crossmart/connectors';
import { OAuthNonceCookie } from './oauth-nonce.cookie.js';

function cookies(apiPublicUrl: string) {
  const response = { cookie: vi.fn(), clearCookie: vi.fn() };
  const cookie = new OAuthNonceCookie({ apiPublicUrl } as AppConfigService);
  return { cookie, response, res: response as unknown as Response };
}

describe('OAuthNonceCookie', () => {
  it('sets an HttpOnly, Secure, SameSite=Lax cookie for the channel’s callback only', () => {
    const { cookie, response, res } = cookies('https://api.crossmart.io');

    cookie.set(res, ChannelType.Ebay, 'nonce-1');

    expect(response.cookie).toHaveBeenCalledWith('crossmart_oauth_nonce', 'nonce-1', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/v1/channels/ebay/oauth/callback',
      maxAge: 600_000,
    });
  });

  it('is not Secure over plain HTTP, for local development', () => {
    const { cookie, response, res } = cookies('http://localhost:3000');

    cookie.clear(res, ChannelType.Shopify);

    expect(response.clearCookie).toHaveBeenCalledWith('crossmart_oauth_nonce', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/api/v1/channels/shopify/oauth/callback',
    });
  });

  it('reads the nonce the browser sent back', () => {
    const { cookie } = cookies('http://localhost:3000');
    const request = { headers: { cookie: 'session=s; crossmart_oauth_nonce=abc' } };

    expect(cookie.read(request as Request)).toBe('abc');
    expect(cookie.read({ headers: {} } as Request)).toBeNull();
  });
});

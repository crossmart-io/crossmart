import { credentialsNeedRefresh, parseChannelCredentials } from './channel-credentials.js';

const NOW = new Date('2026-11-03T10:00:00Z');

describe('parseChannelCredentials', () => {
  it('accepts stored credentials and rejects anything else', () => {
    const credentials = { accessToken: 'token', refreshToken: 'refresh' };

    expect(parseChannelCredentials(JSON.stringify(credentials))).toEqual(credentials);
    expect(() => parseChannelCredentials('{"accessToken":""}')).toThrow(/accessToken/);
    expect(() => parseChannelCredentials('[]')).toThrow(/object/);
  });
});

describe('credentialsNeedRefresh', () => {
  it('is true only for refreshable tokens that expire within the margin', () => {
    const expiresSoon = {
      accessToken: 'a',
      refreshToken: 'r',
      accessTokenExpiresAt: '2026-11-03T10:04:00Z',
    };

    expect(credentialsNeedRefresh(expiresSoon, NOW, 5 * 60_000)).toBe(true);
    expect(credentialsNeedRefresh(expiresSoon, NOW, 60_000)).toBe(false);
    expect(credentialsNeedRefresh({ accessToken: 'a' }, NOW, 5 * 60_000)).toBe(false);
    expect(
      credentialsNeedRefresh({ ...expiresSoon, refreshToken: undefined }, NOW, 5 * 60_000),
    ).toBe(false);
  });
});

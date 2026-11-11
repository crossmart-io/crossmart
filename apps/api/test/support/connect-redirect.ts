import type { ChannelType } from '@crossmart/connectors';

/** What the OAuth callback's redirect to the web app's Stores page says about a connection. */
export interface ConnectedRedirect {
  connectionId: string;
  reconnected: boolean;
}

const STORES_PATH = '/stores';
const UUID_PATTERN = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/;

/**
 * Checks that a successful callback sent the browser to `<webAppUrl>/stores` naming the channel
 * and the connection, and returns the connection and whether it was a re-auth.
 */
export function readConnectedRedirect(
  location: string | undefined,
  webAppUrl: string,
  channel: ChannelType,
): ConnectedRedirect {
  const url = new URL(location ?? '');
  expect(`${url.origin}${url.pathname}`).toBe(`${webAppUrl}${STORES_PATH}`);
  expect(url.searchParams.get('connected')).toBe(channel);
  const connectionId = url.searchParams.get('connectionId') ?? '';
  expect(connectionId).toMatch(UUID_PATTERN);
  const reconnected = url.searchParams.get('reconnected');
  expect([null, 'true']).toContain(reconnected);
  return { connectionId, reconnected: reconnected !== null };
}

/** The Stores page URL a failed callback redirects to. */
export function connectFailureRedirect(
  webAppUrl: string,
  failure: string,
  channel: ChannelType,
): string {
  return `${webAppUrl}${STORES_PATH}?error=${failure}&channel=${channel}`;
}

import { isIP } from 'node:net';
import type { WebhookSettings } from '@crossmart/common';
import { WebhookUrlProblem } from '../enums/webhook-url-problem.enum.js';

export enum UrlProtocol {
  Https = 'https:',
  Http = 'http:',
}

const IPV6_LITERAL_BRACKETS = /^\[|\]$/g;

/** The URL's host without IPv6 brackets: `[::1]` is `::1`. */
export function hostOf(url: URL): string {
  return url.hostname.replace(IPV6_LITERAL_BRACKETS, '');
}

export function isIpLiteral(url: URL): boolean {
  return isIP(hostOf(url)) !== 0;
}

/** What is wrong with the URL's form, before its host is resolved; null when nothing. */
export function urlFormProblem(url: URL, settings: WebhookSettings): WebhookUrlProblem | null {
  if (settings.requireHttps && url.protocol !== UrlProtocol.Https) {
    return WebhookUrlProblem.NotHttps;
  }
  if (url.protocol !== UrlProtocol.Https && url.protocol !== UrlProtocol.Http) {
    return WebhookUrlProblem.NotHttpOrHttps;
  }
  if (url.username || url.password) return WebhookUrlProblem.HasCredentials;
  return null;
}

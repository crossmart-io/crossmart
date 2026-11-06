import { BadRequestException } from '@nestjs/common';
import type { AppConfigService, WebhookSettings } from '@crossmart/common';
import { WebhookUrlProblem } from '../enums/webhook-url-problem.enum.js';
import { WebhookHostResolver } from './webhook-host.resolver.js';
import { WebhookUrlPolicy } from './webhook-url.policy.js';

const PUBLIC_ADDRESS = '93.184.216.34';
const PRODUCTION: WebhookSettings = { allowPrivateUrls: false, requireHttps: true };
const DEVELOPMENT: WebhookSettings = { allowPrivateUrls: false, requireHttps: false };
const SELF_HOSTED: WebhookSettings = { allowPrivateUrls: true, requireHttps: false };

function createPolicy(settings: WebhookSettings, addresses: string[] = [PUBLIC_ADDRESS]) {
  const resolve = vi.fn<WebhookHostResolver['resolve']>().mockResolvedValue(addresses);
  const appConfig = { webhookSettings: settings } as unknown as AppConfigService;
  const resolver = { resolve } as unknown as WebhookHostResolver;
  return { policy: new WebhookUrlPolicy(appConfig, resolver), resolve };
}

/** Why the policy refused the URL with a 400, or null when it was allowed. */
async function refusalOf(policy: WebhookUrlPolicy, url: string): Promise<string | null> {
  const error = await policy.assertAllowed(url).then(
    () => null,
    (caught: unknown) => caught,
  );
  if (error === null) return null;
  if (!(error instanceof BadRequestException)) throw error;
  return error.message;
}

describe('WebhookUrlPolicy', () => {
  it('requires https when the settings ask for it', async () => {
    const { policy } = createPolicy(PRODUCTION);

    expect(await refusalOf(policy, 'http://hooks.example.com/in')).toBe(WebhookUrlProblem.NotHttps);
    expect(await policy.assertAllowed('https://hooks.example.com/in')).toBe(
      'https://hooks.example.com/in',
    );
  });

  it('allows plain http when https is not required', async () => {
    const { policy } = createPolicy(DEVELOPMENT);

    expect(await policy.assertAllowed('http://hooks.example.com/in')).toBe(
      'http://hooks.example.com/in',
    );
  });

  it('refuses schemes other than http and https', async () => {
    const { policy } = createPolicy(DEVELOPMENT);

    expect(await refusalOf(policy, 'ftp://hooks.example.com/in')).toBe(
      WebhookUrlProblem.NotHttpOrHttps,
    );
    expect(await refusalOf(policy, 'file:///etc/passwd')).toBe(WebhookUrlProblem.NotHttpOrHttps);
  });

  it('refuses a URL that carries a user name or password', async () => {
    const { policy } = createPolicy(PRODUCTION);

    expect(await refusalOf(policy, 'https://ana:pw@hooks.example.com/in')).toBe(
      WebhookUrlProblem.HasCredentials,
    );
    expect(await refusalOf(policy, 'https://ana@hooks.example.com/in')).toBe(
      WebhookUrlProblem.HasCredentials,
    );
  });

  it('refuses text that is not a URL', async () => {
    const { policy } = createPolicy(PRODUCTION);

    expect(await refusalOf(policy, 'not a url')).toBe(WebhookUrlProblem.Invalid);
    expect(await refusalOf(policy, '')).toBe(WebhookUrlProblem.Invalid);
  });

  it('refuses private, loopback and link-local IP literals without resolving them', async () => {
    const { policy, resolve } = createPolicy(DEVELOPMENT);

    for (const url of [
      'http://127.0.0.1/in',
      'http://10.0.0.1/in',
      'http://169.254.169.254/latest/meta-data',
      'http://[::1]/in',
      'http://[::ffff:10.0.0.1]/in',
      'http://2130706433/in',
      'http://0x7f.0.0.1/in',
    ]) {
      expect(await refusalOf(policy, url)).toBe(WebhookUrlProblem.PrivateAddress);
    }
    expect(resolve).not.toHaveBeenCalled();
  });

  it('allows a public IP literal', async () => {
    const { policy, resolve } = createPolicy(PRODUCTION);

    expect(await policy.assertAllowed(`https://${PUBLIC_ADDRESS}/in`)).toBe(
      `https://${PUBLIC_ADDRESS}/in`,
    );
    expect(resolve).not.toHaveBeenCalled();
  });

  it('refuses a host that resolves to a private address', async () => {
    const { policy, resolve } = createPolicy(PRODUCTION, ['10.1.2.3']);

    expect(await refusalOf(policy, 'https://internal.example.com/in')).toBe(
      WebhookUrlProblem.PrivateAddress,
    );
    expect(resolve).toHaveBeenCalledWith('internal.example.com');
  });

  it('refuses a host whose addresses mix public and private ones', async () => {
    const { policy } = createPolicy(PRODUCTION, [PUBLIC_ADDRESS, '192.168.1.1']);

    expect(await refusalOf(policy, 'https://mixed.example.com/in')).toBe(
      WebhookUrlProblem.PrivateAddress,
    );
  });

  it('refuses a host that does not resolve', async () => {
    const { policy, resolve } = createPolicy(PRODUCTION);
    resolve.mockRejectedValueOnce(new Error('ENOTFOUND'));
    expect(await refusalOf(policy, 'https://nowhere.example.com/in')).toBe(
      WebhookUrlProblem.Unresolvable,
    );

    resolve.mockResolvedValueOnce([]);
    expect(await refusalOf(policy, 'https://nowhere.example.com/in')).toBe(
      WebhookUrlProblem.Unresolvable,
    );
  });

  it('skips the address checks when private URLs are allowed', async () => {
    const { policy, resolve } = createPolicy(SELF_HOSTED, ['10.0.0.5']);

    expect(await policy.assertAllowed('http://127.0.0.1:3000/in')).toBe('http://127.0.0.1:3000/in');
    expect(await policy.assertAllowed('http://erp.internal/in')).toBe('http://erp.internal/in');
    expect(resolve).not.toHaveBeenCalled();
    expect(policy.allowsPrivateAddresses).toBe(true);
  });

  it('returns the URL normalized', async () => {
    const { policy } = createPolicy(PRODUCTION);

    expect(await policy.assertAllowed('HTTPS://Hooks.Example.COM:443/in?a=1')).toBe(
      'https://hooks.example.com/in?a=1',
    );
  });
});

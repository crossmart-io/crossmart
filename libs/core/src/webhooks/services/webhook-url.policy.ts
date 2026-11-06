import { BadRequestException, Injectable } from '@nestjs/common';
import { AppConfigService, isPublicAddress, type WebhookSettings } from '@crossmart/common';
import { WebhookUrlProblem } from '../enums/webhook-url-problem.enum.js';
import { hostOf, isIpLiteral, urlFormProblem } from '../rules/webhook-url.js';
import { WebhookHostResolver } from './webhook-host.resolver.js';

/**
 * Decides which URLs may receive webhooks, so an endpoint cannot make Crossmart call its own
 * network (SSRF): https in production, and only hosts whose every address is public. The same
 * address check runs again as each delivery connects, against DNS rebinding.
 */
@Injectable()
export class WebhookUrlPolicy {
  private readonly settings: WebhookSettings;

  constructor(
    appConfig: AppConfigService,
    private readonly resolver: WebhookHostResolver,
  ) {
    this.settings = appConfig.webhookSettings;
  }

  /** Whether deliveries may connect to private addresses (a self-hosted, trusted network). */
  get allowsPrivateAddresses(): boolean {
    return this.settings.allowPrivateUrls;
  }

  /** The URL, normalized; throws 400 with the reason when it may not receive webhooks. */
  async assertAllowed(rawUrl: string): Promise<string> {
    const url = URL.canParse(rawUrl) ? new URL(rawUrl) : null;
    if (!url) throw new BadRequestException(WebhookUrlProblem.Invalid);
    const formProblem = urlFormProblem(url, this.settings);
    if (formProblem) throw new BadRequestException(formProblem);
    if (!this.settings.allowPrivateUrls) await this.assertPublicHost(url);
    return url.toString();
  }

  private async assertPublicHost(url: URL): Promise<void> {
    const addresses = isIpLiteral(url) ? [hostOf(url)] : await this.resolve(url);
    if (!addresses.every((address) => isPublicAddress(address))) {
      throw new BadRequestException(WebhookUrlProblem.PrivateAddress);
    }
  }

  private async resolve(url: URL): Promise<string[]> {
    const addresses = await this.resolver.resolve(hostOf(url)).catch(() => []);
    if (addresses.length === 0) throw new BadRequestException(WebhookUrlProblem.Unresolvable);
    return addresses;
  }
}

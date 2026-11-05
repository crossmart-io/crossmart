import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';

/**
 * Whether plan limits block actions, from `ENTITLEMENTS_ENFORCED`. Off by default until billing
 * lets merchants upgrade; usage and limits are computed and reported either way.
 */
@Injectable()
export class EntitlementEnforcement {
  constructor(private readonly appConfig: AppConfigService) {}

  get enforced(): boolean {
    return this.appConfig.entitlementsEnforced;
  }
}

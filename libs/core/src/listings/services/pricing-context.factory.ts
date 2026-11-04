import { Injectable } from '@nestjs/common';
import type { ConnectionSettings } from '../../channels/entities/connection-settings.js';
import type { PricingRule } from '../../channels/entities/pricing-rule.js';
import { ExchangeRatesService } from '../../currency/services/exchange-rates.service.js';
import { WorkspaceSettingsRepository } from '../../workspace-settings/workspace-settings.repository.js';
import type { PriceConversion, PricingContext } from '../entities/price-resolution.js';
import { ExchangeRateSource } from '../enums/exchange-rate-source.enum.js';
import { connectionCurrency } from '../rules/connection-currency.js';

const ISO_DATE_LENGTH = 10;

/**
 * What pricing a connection needs: its rule, its currency, and how catalog prices convert into
 * it when the store sells in another currency than the workspace.
 */
@Injectable()
export class PricingContextFactory {
  constructor(
    private readonly workspaces: WorkspaceSettingsRepository,
    private readonly rates: ExchangeRatesService,
  ) {}

  /** `rule` defaults to the connection's saved one; previews pass the one being edited. */
  async build(
    workspaceId: string,
    settings: ConnectionSettings,
    rule: PricingRule | null = settings.pricing,
  ): Promise<PricingContext> {
    const currencyCode = connectionCurrency(settings);
    const { currency } = await this.workspaces.get(workspaceId);
    return { rule, currencyCode, conversion: await this.conversion(currency, currencyCode, rule) };
  }

  private async conversion(
    from: string,
    to: string,
    rule: PricingRule | null,
  ): Promise<PriceConversion | null> {
    if (from === to) return null;
    if (rule?.fixedExchangeRate) {
      const rate = rule.fixedExchangeRate;
      return { from, to, rate, source: ExchangeRateSource.Fixed, publishedOn: null };
    }
    const quote = await this.rates.quote(from, to);
    return {
      from,
      to,
      rate: quote?.rate ?? null,
      source: ExchangeRateSource.Ecb,
      publishedOn: quote ? quote.publishedOn.toISOString().slice(0, ISO_DATE_LENGTH) : null,
    };
  }
}

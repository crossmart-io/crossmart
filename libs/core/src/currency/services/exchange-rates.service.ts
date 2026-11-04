import { Injectable, Logger } from '@nestjs/common';
import { FixedDecimal, RoundingMode } from '@crossmart/common';
import { EcbRatesClient } from '../clients/ecb-rates.client.js';
import type { ExchangeRateQuote } from '../entities/exchange-rate.js';
import {
  EURO,
  RATE_FRACTION_DIGITS,
  RATES_CHECK_INTERVAL_MS,
  RATES_MAX_AGE_MS,
} from '../currency.constants.js';
import {
  ExchangeRateRepository,
  type StoredRate,
} from '../repositories/exchange-rate.repository.js';

const EURO_RATE: StoredRate = { ratePerEuro: '1', publishedOn: new Date(0) };

/**
 * Converts between currencies with the ECB's daily reference rates, through the euro. Rates
 * are stored; stale ones are refreshed on use, at most once an hour per process.
 */
@Injectable()
export class ExchangeRatesService {
  private readonly logger = new Logger(ExchangeRatesService.name);
  private lastCheckAt = 0;
  private refreshing: Promise<void> | null = null;

  constructor(
    private readonly rates: ExchangeRateRepository,
    private readonly ecb: EcbRatesClient,
  ) {}

  /** Units of `to` per unit of `from`, or null when either currency has no rate. */
  async quote(from: string, to: string, now = new Date()): Promise<ExchangeRateQuote | null> {
    await this.refreshIfStale(now);
    const stored = await this.rates.latest([from, to].filter((code) => code !== EURO));
    const fromRate = from === EURO ? EURO_RATE : stored.get(from);
    const toRate = to === EURO ? EURO_RATE : stored.get(to);
    if (!fromRate || !toRate) return null;
    const rate = FixedDecimal.of(toRate.ratePerEuro)
      .dividedBy(FixedDecimal.of(fromRate.ratePerEuro))
      .round(RATE_FRACTION_DIGITS, RoundingMode.HalfUp);
    const publishedOn = fromRate.publishedOn > toRate.publishedOn ? fromRate : toRate;
    return { from, to, rate: rate.toString(), publishedOn: publishedOn.publishedOn };
  }

  private async refreshIfStale(now: Date): Promise<void> {
    if (now.getTime() - this.lastCheckAt < RATES_CHECK_INTERVAL_MS) return;
    const latest = await this.rates.latestPublishedOn();
    if (latest && now.getTime() - latest.getTime() < RATES_MAX_AGE_MS) return;
    this.lastCheckAt = now.getTime();
    this.refreshing ??= this.refresh().finally(() => {
      this.refreshing = null;
    });
    await this.refreshing;
  }

  /** A failed refresh is logged: the stored rates, if any, are used meanwhile. */
  private async refresh(): Promise<void> {
    try {
      await this.rates.saveDay(await this.ecb.fetchDaily());
    } catch (error) {
      this.logger.warn(`Could not refresh exchange rates: ${String(error)}`);
    }
  }
}

import { Injectable } from '@nestjs/common';
import type { DailyRates } from '../entities/exchange-rate.js';
import { ECB_DAILY_RATES_URL, ECB_REQUEST_TIMEOUT_MS } from '../currency.constants.js';

const DAY_PATTERN = /<Cube\s+time=['"](\d{4}-\d{2}-\d{2})['"]/;
const RATE_PATTERN = /<Cube\s+currency=['"]([A-Z]{3})['"]\s+rate=['"](\d+(?:\.\d+)?)['"]/g;

/** Reads the ECB's daily reference rates. Throws when the feed cannot be read. */
@Injectable()
export class EcbRatesClient {
  async fetchDaily(): Promise<DailyRates> {
    const response = await fetch(ECB_DAILY_RATES_URL, {
      signal: AbortSignal.timeout(ECB_REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`ECB rates answered ${response.status}`);
    }
    return parseDailyRates(await response.text());
  }
}

/** The day and the rates of the ECB's daily XML. */
export function parseDailyRates(xml: string): DailyRates {
  const day = DAY_PATTERN.exec(xml)?.[1];
  const ratesPerEuro = new Map(
    [...xml.matchAll(RATE_PATTERN)].map(([, currency, rate]) => [currency ?? '', rate ?? '']),
  );
  if (!day || ratesPerEuro.size === 0) {
    throw new Error('ECB rates feed had no rates');
  }
  return { publishedOn: new Date(`${day}T00:00:00Z`), ratesPerEuro };
}

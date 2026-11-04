import { Injectable } from '@nestjs/common';
import { PrismaService } from '@crossmart/database';
import type { DailyRates } from '../entities/exchange-rate.js';

/** The latest stored rate of a currency, per euro. */
export interface StoredRate {
  ratePerEuro: string;
  publishedOn: Date;
}

@Injectable()
export class ExchangeRateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async latestPublishedOn(): Promise<Date | null> {
    const latest = await this.prisma.exchangeRate.findFirst({
      orderBy: { publishedOn: 'desc' },
      select: { publishedOn: true },
    });
    return latest?.publishedOn ?? null;
  }

  /** The most recent rate of each currency asked for that has one. */
  async latest(currencies: readonly string[]): Promise<Map<string, StoredRate>> {
    const rows = await this.prisma.exchangeRate.findMany({
      where: { currency: { in: [...currencies] } },
      orderBy: { publishedOn: 'desc' },
      distinct: ['currency'],
    });
    return new Map(
      rows.map((row) => [
        row.currency,
        { ratePerEuro: row.ratePerEuro.toString(), publishedOn: row.publishedOn },
      ]),
    );
  }

  /** Stores a day's rates; a day already stored is left as it is. */
  async saveDay(daily: DailyRates): Promise<void> {
    await this.prisma.exchangeRate.createMany({
      data: [...daily.ratesPerEuro].map(([currency, ratePerEuro]) => ({
        currency,
        ratePerEuro,
        publishedOn: daily.publishedOn,
      })),
      skipDuplicates: true,
    });
  }
}

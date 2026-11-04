import { Module } from '@nestjs/common';
import { EcbRatesClient } from './clients/ecb-rates.client.js';
import { ExchangeRateRepository } from './repositories/exchange-rate.repository.js';
import { ExchangeRatesService } from './services/exchange-rates.service.js';

/** Exchange rates for pricing listings in a store's currency. */
@Module({
  providers: [EcbRatesClient, ExchangeRateRepository, ExchangeRatesService],
  exports: [ExchangeRatesService],
})
export class CurrencyModule {}

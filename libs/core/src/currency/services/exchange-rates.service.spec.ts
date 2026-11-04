import type { EcbRatesClient } from '../clients/ecb-rates.client.js';
import type {
  ExchangeRateRepository,
  StoredRate,
} from '../repositories/exchange-rate.repository.js';
import { ExchangeRatesService } from './exchange-rates.service.js';

const NOW = new Date('2026-11-04T18:00:00Z');
const TODAY = new Date('2026-11-04T00:00:00Z');

function createService(latestDay: Date | null, stored: Record<string, string>) {
  const rates = {
    latestPublishedOn: vi.fn().mockResolvedValue(latestDay),
    latest: vi.fn((codes: string[]) =>
      Promise.resolve(
        new Map<string, StoredRate>(
          codes.flatMap((code) =>
            stored[code] ? [[code, { ratePerEuro: stored[code], publishedOn: TODAY }]] : [],
          ),
        ),
      ),
    ),
    saveDay: vi.fn(),
  };
  const ecb = {
    fetchDaily: vi.fn().mockResolvedValue({ publishedOn: TODAY, ratesPerEuro: new Map() }),
  };
  const service = new ExchangeRatesService(
    rates as unknown as ExchangeRateRepository,
    ecb as unknown as EcbRatesClient,
  );
  return { service, rates, ecb };
}

describe('ExchangeRatesService.quote', () => {
  it('converts any pair through the euro', async () => {
    const { service, ecb } = createService(TODAY, { USD: '1.08', ILS: '4.05' });
    await expect(service.quote('USD', 'ILS', NOW)).resolves.toMatchObject({ rate: '3.75' });
    await expect(service.quote('EUR', 'USD', NOW)).resolves.toMatchObject({ rate: '1.08' });
    await expect(service.quote('USD', 'EUR', NOW)).resolves.toMatchObject({ rate: '0.925926' });
    expect(ecb.fetchDaily).not.toHaveBeenCalled();
  });

  it('refreshes stale rates once, and says when a currency has none', async () => {
    const { service, ecb, rates } = createService(new Date('2026-11-01T00:00:00Z'), {});
    await expect(service.quote('USD', 'XYZ', NOW)).resolves.toBeNull();
    await service.quote('USD', 'XYZ', NOW);
    expect(ecb.fetchDaily).toHaveBeenCalledTimes(1);
    expect(rates.saveDay).toHaveBeenCalledTimes(1);
  });

  it('keeps working on stored rates when the ECB is down', async () => {
    const { service, ecb } = createService(null, { USD: '1.08' });
    ecb.fetchDaily.mockRejectedValueOnce(new Error('down'));
    await expect(service.quote('EUR', 'USD', NOW)).resolves.toMatchObject({ rate: '1.08' });
  });
});

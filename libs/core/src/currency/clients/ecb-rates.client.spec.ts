import { parseDailyRates } from './ecb-rates.client.js';

const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01">
  <Cube>
    <Cube time='2026-11-04'>
      <Cube currency='USD' rate='1.0823'/>
      <Cube currency='ILS' rate='4.0518'/>
    </Cube>
  </Cube>
</gesmes:Envelope>`;

describe('parseDailyRates', () => {
  it('reads the day and every rate per euro', () => {
    const daily = parseDailyRates(FEED);
    expect(daily.publishedOn.toISOString()).toBe('2026-11-04T00:00:00.000Z');
    expect(Object.fromEntries(daily.ratesPerEuro)).toEqual({ USD: '1.0823', ILS: '4.0518' });
  });

  it('refuses a feed without rates', () => {
    expect(() => parseDailyRates('<html>maintenance</html>')).toThrow('no rates');
  });
});

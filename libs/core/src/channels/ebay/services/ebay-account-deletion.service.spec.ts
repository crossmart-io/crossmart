import { BadGatewayException, PreconditionFailedException } from '@nestjs/common';
import {
  ChannelError,
  ChannelErrorCode,
  ChannelType,
  type EbayNotificationVerifier,
} from '@crossmart/connectors';
import type { EbayAccountPurger } from './ebay-account.purger.js';
import { EbayAccountDeletionService } from './ebay-account-deletion.service.js';

const SIGNATURE = 'eyJraWQiOiJrIiwic2lnbmF0dXJlIjoicyJ9';
const NOTICE = {
  metadata: { topic: 'MARKETPLACE_ACCOUNT_DELETION', schemaVersion: '1.0', deprecated: false },
  notification: {
    notificationId: 'n-1',
    data: { username: 'demo_seller', userId: 'nY4uWx2bQ1e', eiasToken: 'eias' },
  },
};

function webhook(body: unknown = NOTICE) {
  return {
    rawBody: Buffer.from(JSON.stringify(body)),
    headers: { 'x-ebay-signature': SIGNATURE },
  };
}

function setup(verified: boolean | Error = true) {
  const verify = vi.fn<EbayNotificationVerifier['verify']>();
  if (verified instanceof Error) verify.mockRejectedValue(verified);
  else verify.mockResolvedValue(verified);
  const purge = vi.fn<EbayAccountPurger['purge']>().mockResolvedValue(2);
  const service = new EbayAccountDeletionService(
    { verify } as unknown as EbayNotificationVerifier,
    { purge } as unknown as EbayAccountPurger,
  );
  return { service, verify, purge };
}

describe('EbayAccountDeletionService', () => {
  it('verifies the raw body with the signature header, then purges the user', async () => {
    const { service, verify, purge } = setup();
    const delivery = webhook();

    await service.receive(delivery);

    expect(verify).toHaveBeenCalledWith(delivery.rawBody, SIGNATURE);
    expect(purge).toHaveBeenCalledWith('nY4uWx2bQ1e');
  });

  it('answers 412 and purges nothing when the signature does not verify', async () => {
    const { service, purge } = setup(false);

    await expect(service.receive(webhook())).rejects.toThrow(PreconditionFailedException);
    expect(purge).not.toHaveBeenCalled();
  });

  it('answers 502 when eBay cannot serve its key, so eBay delivers again', async () => {
    const outage = new ChannelError(ChannelType.Ebay, ChannelErrorCode.ChannelUnavailable, 'down');
    const { service, purge } = setup(outage);

    await expect(service.receive(webhook())).rejects.toThrow(BadGatewayException);
    expect(purge).not.toHaveBeenCalled();
  });

  it('acknowledges verified notices about other topics', async () => {
    const { service, purge } = setup();

    await service.receive(webhook({ ...NOTICE, metadata: { topic: 'ITEM_SOLD' } }));

    expect(purge).not.toHaveBeenCalled();
  });

  it('never logs the username, the eias token or the signature', async () => {
    const { service } = setup();
    const log = vi.spyOn(service['logger'], 'log');

    await service.receive(webhook());

    const logged = JSON.stringify(log.mock.calls);
    for (const secret of ['demo_seller', 'eias', SIGNATURE, 'nY4uWx2bQ1e']) {
      expect(logged).not.toContain(secret);
    }
  });
});

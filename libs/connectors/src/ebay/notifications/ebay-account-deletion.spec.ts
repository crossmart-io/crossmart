import { loadFixture } from '../../sdk/testing/fixtures.js';
import { FIXTURES, USER_ID } from '../ebay.fixtures.js';
import { parseEbayAccountDeletion } from './ebay-account-deletion.js';

const NOTICE = loadFixture(FIXTURES, 'account-deletion-notification.json');

describe('parseEbayAccountDeletion', () => {
  it('reads the notification id and the immutable user id only', () => {
    expect(parseEbayAccountDeletion(Buffer.from(NOTICE))).toEqual({
      notificationId: '3f1c9a52-7d4e-4b8a-9c21-5e6f7a8b9c0d_8e2d4f6a-1b3c-4d5e-8f7a-9b0c1d2e3f4a',
      userId: USER_ID,
    });
  });

  it('ignores other topics and bodies that are not notices', () => {
    const other = JSON.parse(NOTICE) as { metadata: { topic: string } };
    other.metadata.topic = 'PRIORITY_LISTING_REVISION';

    expect(parseEbayAccountDeletion(Buffer.from(JSON.stringify(other)))).toBeNull();
    expect(parseEbayAccountDeletion(Buffer.from('not json'))).toBeNull();
    expect(parseEbayAccountDeletion(Buffer.from('{}'))).toBeNull();
  });
});

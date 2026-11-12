import { BadRequestException } from '@nestjs/common';
import type { SellerCredentialField } from '@crossmart/connectors';
import { parseSellerCredentialValues } from './seller-credential-values.js';

const FIELDS: SellerCredentialField[] = [
  { key: 'userId', secret: false, maxLength: 20 },
  { key: 'apiKey', secret: true, maxLength: 8 },
  { key: 'country', secret: false, maxLength: 4, options: ['facl', 'fape'] },
];

describe('parseSellerCredentialValues', () => {
  it('returns every field, trimmed', () => {
    expect(
      parseSellerCredentialValues(FIELDS, { userId: ' me@x.io ', apiKey: 'k1', country: 'fape' }),
    ).toEqual({ userId: 'me@x.io', apiKey: 'k1', country: 'fape' });
  });

  it('names every field at fault without echoing a value', () => {
    const parse = () =>
      parseSellerCredentialValues(FIELDS, {
        apiKey: 'secret-too-long',
        country: 'famx',
        extra: 'x',
      });

    expect(parse).toThrow(BadRequestException);
    expect(parse).toThrow(
      'extra is not a credential of this channel; userId is required; apiKey is too long; country is not one of the accepted values',
    );
    expect(parse).not.toThrow(/secret-too-long/);
  });

  it('treats values that are not text as missing', () => {
    expect(() =>
      parseSellerCredentialValues(FIELDS, { userId: 42, apiKey: 'k', country: 'facl' }),
    ).toThrow('userId is required');
  });
});

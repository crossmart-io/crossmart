import {
  canonicalQuery,
  encodeRfc3986,
  falabellaTimestamp,
  signFalabellaQuery,
} from './falabella-signature.js';

/** The verification example of Falabella's "Signing requests" page and its reference key. */
const DOCS_PARAMS = {
  UserID: 'look@me.com',
  Version: '1.0',
  Action: 'FeedList',
  Format: 'XML',
  Timestamp: '2015-07-01T11:11:11+00:00',
};
const DOCS_API_KEY = 'b1bdb357ced10fe4e9a69840cdd4f0e9c03d77fe';
const DOCS_SIGNATURE = '3ceb8ed91049dfc718b0d2d176fb2ed0e5fd74f76c5971f34cdab48412476041';

describe('Falabella request signing', () => {
  it('builds the sorted, RFC 3986-encoded string the docs sign', () => {
    expect(canonicalQuery(DOCS_PARAMS)).toBe(
      'Action=FeedList&Format=XML&Timestamp=2015-07-01T11%3A11%3A11%2B00%3A00&UserID=look%40me.com&Version=1.0',
    );
  });

  it('reproduces the signature of the docs’ verification example', () => {
    expect(signFalabellaQuery(DOCS_PARAMS, DOCS_API_KEY)).toBe(DOCS_SIGNATURE);
  });

  it('encodes what encodeURIComponent leaves alone, and spaces as %20', () => {
    expect(encodeRfc3986("a b!'()*~._-")).toBe('a%20b%21%27%28%29%2A~._-');
  });

  it('formats timestamps to the second with a UTC offset', () => {
    expect(falabellaTimestamp(new Date('2026-11-12T08:09:10.123Z'))).toBe(
      '2026-11-12T08:09:10+00:00',
    );
  });
});

import { isPublicAddress } from './public-address.js';

describe('isPublicAddress', () => {
  it('accepts public IPv4 and IPv6 addresses', () => {
    expect(isPublicAddress('93.184.215.14')).toBe(true);
    expect(isPublicAddress('2606:2800:21f:cb07:6820:80da:af6b:8b2c')).toBe(true);
  });

  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.20.0.5',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '::1',
    '::',
    'fd00::1',
    'fe80::1',
    '::ffff:127.0.0.1',
    '::FFFF:10.0.0.1',
    'localhost',
    '',
  ])('refuses %s', (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });
});

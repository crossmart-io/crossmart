import { sandboxOwnerName } from './sandbox-owner-name.js';

describe('sandboxOwnerName', () => {
  it('names the owner after the local part of their address', () => {
    expect(sandboxOwnerName('ana.lopez@example.com')).toBe('ana.lopez');
  });

  it('keeps an address without a local part whole', () => {
    expect(sandboxOwnerName('@example.com')).toBe('@example.com');
  });
});

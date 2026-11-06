import type { LookupAddress, LookupAllOptions, LookupOptions } from 'node:dns';
import type { LookupFunction } from 'node:net';
import { isPublicAddress } from './public-address.js';

const PRIVATE_ADDRESS_CODE = 'EPRIVATEADDRESS';
const PRIVATE_ADDRESS_MESSAGE = 'The host resolves to an address that may not be reached';

/** DNS resolution of every address of a host, as `dns.lookup` does with `all: true`. */
export type ResolveAll = (
  hostname: string,
  options: LookupAllOptions,
  callback: (error: NodeJS.ErrnoException | null, addresses: LookupAddress[]) => void,
) => void;

/** The error a guarded lookup fails with when a host resolves to a private address. */
export class PrivateAddressError extends Error {
  readonly code = PRIVATE_ADDRESS_CODE;

  constructor() {
    super(PRIVATE_ADDRESS_MESSAGE);
    this.name = 'PrivateAddressError';
  }
}

/**
 * A `lookup` for sockets that refuses hosts with any non-public address. It runs when the
 * socket connects, so the address checked is the address used: a host cannot pass the check
 * and then resolve elsewhere (DNS rebinding).
 */
export function guardedLookup(resolveAll: ResolveAll): LookupFunction {
  return (hostname: string, options: LookupOptions, callback) => {
    resolveAll(hostname, { ...options, all: true }, (error, addresses) => {
      if (error) {
        callback(error, []);
        return;
      }
      if (addresses.length === 0 || !addresses.every(({ address }) => isPublicAddress(address))) {
        callback(new PrivateAddressError(), []);
        return;
      }
      const [first] = addresses;
      if (options.all) callback(null, addresses);
      else callback(null, first.address, first.family);
    });
  };
}

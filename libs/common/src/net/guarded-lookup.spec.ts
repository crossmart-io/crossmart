import type { LookupAddress } from 'node:dns';
import { guardedLookup, PrivateAddressError, type ResolveAll } from './guarded-lookup.js';

function resolvingTo(
  addresses: LookupAddress[],
  error: NodeJS.ErrnoException | null = null,
): ResolveAll {
  return (_hostname, _options, callback) => callback(error, addresses);
}

function lookUp(resolve: ResolveAll, all: boolean): Promise<unknown[]> {
  return new Promise((done) => {
    guardedLookup(resolve)('images.example', { all }, (...answer: unknown[]) => done(answer));
  });
}

describe('guardedLookup', () => {
  const PUBLIC = { address: '93.184.215.14', family: 4 };

  it('answers the first public address, or all of them when asked', async () => {
    expect(await lookUp(resolvingTo([PUBLIC]), false)).toEqual([null, PUBLIC.address, 4]);
    expect(await lookUp(resolvingTo([PUBLIC]), true)).toEqual([null, [PUBLIC]]);
  });

  it('refuses a host with any private address, or none', async () => {
    const [mixed] = await lookUp(resolvingTo([PUBLIC, { address: '10.0.0.7', family: 4 }]), false);
    const [empty] = await lookUp(resolvingTo([]), false);

    expect(mixed).toBeInstanceOf(PrivateAddressError);
    expect(empty).toBeInstanceOf(PrivateAddressError);
  });

  it('passes DNS errors on', async () => {
    const failure = Object.assign(new Error('not found'), { code: 'ENOTFOUND' });

    const [error] = await lookUp(resolvingTo([], failure), false);

    expect(error).toBe(failure);
  });
});

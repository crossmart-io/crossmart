import { BlockList, isIPv4, isIPv6 } from 'node:net';
import { BLOCKED_IPV4_SUBNETS, BLOCKED_IPV6_SUBNETS, IPV4_MAPPED_PREFIX } from './net.constants.js';

enum AddressFamily {
  Ipv4 = 'ipv4',
  Ipv6 = 'ipv6',
}

function blockedAddresses(): BlockList {
  const blocked = new BlockList();
  for (const [network, prefix] of BLOCKED_IPV4_SUBNETS) {
    blocked.addSubnet(network, prefix, AddressFamily.Ipv4);
  }
  for (const [network, prefix] of BLOCKED_IPV6_SUBNETS) {
    blocked.addSubnet(network, prefix, AddressFamily.Ipv6);
  }
  return blocked;
}

const BLOCKED = blockedAddresses();

/**
 * Whether an IP address is on the public internet, so a server-side download may reach it.
 * Private, loopback, link-local and reserved addresses are not, nor are IPv6 addresses that
 * embed one of them, nor anything that is not an IP address.
 */
export function isPublicAddress(address: string): boolean {
  const lowered = address.toLowerCase();
  if (lowered.startsWith(IPV4_MAPPED_PREFIX) && isIPv4(lowered.slice(IPV4_MAPPED_PREFIX.length))) {
    return isPublicAddress(lowered.slice(IPV4_MAPPED_PREFIX.length));
  }
  if (isIPv4(lowered)) return !BLOCKED.check(lowered, AddressFamily.Ipv4);
  if (isIPv6(lowered)) return !BLOCKED.check(lowered, AddressFamily.Ipv6);
  return false;
}

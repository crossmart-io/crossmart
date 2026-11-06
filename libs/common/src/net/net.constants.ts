/**
 * Addresses a server-side request (an image download, a webhook delivery) must never reach:
 * loopback, private networks, link-local (cloud metadata services live at 169.254.169.254),
 * carrier-grade NAT, benchmarking, multicast and reserved ranges, as `[network, prefix]` pairs.
 */
export const BLOCKED_IPV4_SUBNETS: readonly (readonly [string, number])[] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

export const BLOCKED_IPV6_SUBNETS: readonly (readonly [string, number])[] = [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96],
  ['100::', 64],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
];

/** IPv6 addresses that embed an IPv4 one (`::ffff:10.0.0.1`), checked as that IPv4 address. */
export const IPV4_MAPPED_PREFIX = '::ffff:';

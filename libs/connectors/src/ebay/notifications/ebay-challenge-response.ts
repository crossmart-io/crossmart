import { createHash } from 'node:crypto';

const CHALLENGE_HASH = 'sha256';
const HEX = 'hex';

/**
 * What eBay expects back when it checks a notification endpoint: the hex SHA-256 of the
 * challenge code, the verification token and the endpoint URL, in exactly that order. The URL
 * must be the one registered with eBay, character for character.
 */
export function ebayChallengeResponse(
  challengeCode: string,
  verificationToken: string,
  endpointUrl: string,
): string {
  return createHash(CHALLENGE_HASH)
    .update(challengeCode)
    .update(verificationToken)
    .update(endpointUrl)
    .digest(HEX);
}

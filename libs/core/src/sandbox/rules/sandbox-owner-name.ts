import { EMAIL_DOMAIN_SEPARATOR } from '../sandbox.constants.js';

/** The name of a sandbox account's owner, until they set one: their address's local part. */
export function sandboxOwnerName(email: string): string {
  const [localPart] = email.split(EMAIL_DOMAIN_SEPARATOR);
  return localPart || email;
}

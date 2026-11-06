/**
 * Why an attempt got no successful answer, in words safe to show the merchant: never the
 * response body, the secret or internal errors.
 */
export enum WebhookDeliveryFailure {
  Timeout = 'The endpoint did not answer in time',
  Unreachable = 'The endpoint could not be reached',
  PrivateAddress = 'The endpoint resolves to a private address',
  /** Followed by the status code. */
  ErrorStatus = 'The endpoint answered with HTTP',
  Redirect = 'The endpoint answered with a redirect, which is not followed',
  SecretUnavailable = 'The signing secret could not be read',
}

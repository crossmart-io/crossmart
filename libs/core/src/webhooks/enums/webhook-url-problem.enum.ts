/** Why an endpoint URL is refused, as the API reports it. */
export enum WebhookUrlProblem {
  Invalid = 'The URL is not valid',
  NotHttps = 'The URL must use https',
  NotHttpOrHttps = 'The URL must use http or https',
  HasCredentials = 'The URL must not contain a user name or password',
  PrivateAddress = 'The URL must point to a public address',
  Unresolvable = 'The URL’s host could not be found',
}

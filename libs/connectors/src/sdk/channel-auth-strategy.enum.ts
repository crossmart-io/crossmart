export enum ChannelAuthStrategy {
  /** Merchant authorizes the Crossmart app on the marketplace (cloud default). */
  OAuthApp = 'oauth_app',
  /** Merchant pastes credentials issued by the marketplace (e.g. Walmart, self-hosted installs). */
  SellerCredentials = 'seller_credentials',
}

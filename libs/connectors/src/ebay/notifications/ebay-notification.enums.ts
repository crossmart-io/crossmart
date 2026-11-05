/** Topics of eBay push notifications Crossmart handles. */
export enum EbayNotificationTopic {
  /** An eBay user asked eBay to delete their account: delete what is stored about them. */
  MarketplaceAccountDeletion = 'MARKETPLACE_ACCOUNT_DELETION',
}

/** The signature algorithm the Notification API names for a public key. */
export enum EbaySignatureAlgorithm {
  Ecdsa = 'ECDSA',
}

/** The digest the Notification API names for a public key; eBay signs with SHA-1 today. */
export enum EbaySignatureDigest {
  Sha1 = 'SHA1',
  Sha256 = 'SHA256',
}

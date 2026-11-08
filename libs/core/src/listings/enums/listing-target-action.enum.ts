/** What a content sync does with a product on a channel. */
export enum ListingTargetAction {
  Publish = 'publish',
  Delist = 'delist',
  /** Nothing to do: the product is not selected and the channel does not hold it. */
  Skip = 'skip',
  /**
   * The product is taken out of the store, but the channel never received it (its publish was
   * refused or is still waiting): nothing is sent, the listing is only cleared in Crossmart.
   */
  Withdraw = 'withdraw',
  /** Publishing would make it a new active listing that the plan has no room for. */
  Blocked = 'blocked',
}

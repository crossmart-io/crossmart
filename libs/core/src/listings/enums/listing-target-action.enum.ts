/** What a content sync does with a product on a channel. */
export enum ListingTargetAction {
  Publish = 'publish',
  Delist = 'delist',
  /** Nothing to do: the product is not selected and the channel does not hold it. */
  Skip = 'skip',
}

/** Where a piece of Ask's knowledge comes from. */
export enum KnowledgeSourceKind {
  /** A page of docs.crossmart.io (the crossmart-docs repository). */
  Docs = 'docs',
  /** A section of crossmart.io, such as the channel list or the FAQ. */
  Site = 'site',
  /** The offered plans, read from the plan data at run time. */
  Plans = 'plans',
  /** The caller's own workspace data, read for one answer and never indexed. */
  Account = 'account',
}

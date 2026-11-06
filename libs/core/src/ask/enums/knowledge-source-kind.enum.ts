/** Where a piece of Ask's knowledge comes from. */
export enum KnowledgeSourceKind {
  /** A page of docs.crossmart.io (the crossmart-docs repository). */
  Docs = 'docs',
  /** A document in the backend repository, such as a channel guide. */
  Repository = 'repository',
  /** The offered plans, read from the plan data at run time. */
  Plans = 'plans',
}

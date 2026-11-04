export interface WorkspaceInput {
  name: string;
  /** ISO 4217 code of the catalog's prices; fixed once the workspace exists. */
  currency?: string;
}

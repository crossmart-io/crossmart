export enum HttpMethod {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Patch = 'PATCH',
  Delete = 'DELETE',
}

export type QueryValue = string | number | boolean | undefined;

/** One request a tool makes. `{workspaceId}` in the path is filled in by the client. */
export interface ApiCall {
  method: HttpMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
}

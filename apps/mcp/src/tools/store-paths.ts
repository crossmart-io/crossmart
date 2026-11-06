import { WORKSPACE_PATH } from '../mcp.constants.js';

/** API paths for stores (channel connections) and the products listed on them. */
export const STORES_PATH = `${WORKSPACE_PATH}/channel-connections`;

export function storePath(connectionId: string): string {
  return `${STORES_PATH}/${connectionId}`;
}

/** A product on every store. */
export function productStoresPath(productId: string): string {
  return `${WORKSPACE_PATH}/products/${productId}/channels`;
}

/** A product on one store, optionally one of its parts such as `retry` or `item-specifics`. */
export function productStorePath(productId: string, connectionId: string, part?: string): string {
  const path = `${productStoresPath(productId)}/${connectionId}`;
  return part ? `${path}/${part}` : path;
}

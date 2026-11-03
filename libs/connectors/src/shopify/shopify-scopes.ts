import {
  SHOPIFY_READ_SCOPE_PREFIX,
  SHOPIFY_SCOPE_SEPARATOR,
  SHOPIFY_WRITE_SCOPE_PREFIX,
} from './shopify.constants.js';

export function parseScopes(scope: string): string[] {
  return scope
    .split(SHOPIFY_SCOPE_SEPARATOR)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

/** Scopes of `required` that `granted` does not cover. A `write_x` grant covers `read_x`. */
export function missingScopes(granted: readonly string[], required: readonly string[]): string[] {
  const grantedSet = new Set(granted);
  return required.filter((scope) => {
    const impliedBy = scope.startsWith(SHOPIFY_READ_SCOPE_PREFIX)
      ? `${SHOPIFY_WRITE_SCOPE_PREFIX}${scope.slice(SHOPIFY_READ_SCOPE_PREFIX.length)}`
      : null;
    return !grantedSet.has(scope) && !(impliedBy && grantedSet.has(impliedBy));
  });
}

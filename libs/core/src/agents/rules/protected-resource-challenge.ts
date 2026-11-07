import {
  AGENT_SCOPES,
  BEARER_CHALLENGE_SCHEME,
  CHALLENGE_PARAMETER_SEPARATOR,
  INVALID_TOKEN_ERROR,
  PROTECTED_RESOURCE_METADATA_PATH,
  SCOPE_SEPARATOR,
} from '../agents.constants.js';

/**
 * Where a resource's Protected Resource Metadata (RFC 9728 §3.1) is served, as paths on its
 * origin: the well-known path with the resource's own path appended, then the bare well-known path.
 */
export function protectedResourceMetadataPaths(resourceUrl: string): string[] {
  const { pathname } = new URL(resourceUrl);
  return [`${PROTECTED_RESOURCE_METADATA_PATH}${pathname}`, PROTECTED_RESOURCE_METADATA_PATH];
}

/** The full URL of a resource's Protected Resource Metadata, the one a 401 points to. */
export function protectedResourceMetadataUrl(resourceUrl: string): string {
  const [metadataPath] = protectedResourceMetadataPaths(resourceUrl);
  return new URL(metadataPath, resourceUrl).toString();
}

/**
 * The `WWW-Authenticate` value of a 401 (RFC 6750 §3 and RFC 9728 §5.1): it points to the
 * resource's metadata, where an agent finds the authorization server, and names the scopes to
 * ask for. `invalid_token` when a credential was sent but refused.
 */
export function bearerChallenge(resourceUrl: string, tokenRefused: boolean): string {
  const parameters = [
    ...(tokenRefused ? [`error="${INVALID_TOKEN_ERROR}"`] : []),
    `resource_metadata="${protectedResourceMetadataUrl(resourceUrl)}"`,
    `scope="${AGENT_SCOPES.join(SCOPE_SEPARATOR)}"`,
  ];
  return `${BEARER_CHALLENGE_SCHEME} ${parameters.join(CHALLENGE_PARAMETER_SEPARATOR)}`;
}

import { jwtVerify, type JWTPayload, SignJWT } from 'jose';
import { hmacSha256 } from './hmac.js';

const ALGORITHM = 'HS256';
const SECONDS_SUFFIX = 's';
const HEX = 'hex';

/** What one kind of internal token is for: its own key, audience and lifetime. */
export interface InternalTokenOptions {
  /** The server secret the key is derived from. */
  secret: string;
  /** What the key is derived for, so it is good for nothing else, such as `crossmart:x:v1`. */
  keyContext: string;
  issuer: string;
  audience: string;
  ttlSeconds: number;
}

/** A verified token's subject and claims. */
export interface InternalTokenClaims {
  subject: string;
  claims: JWTPayload;
}

/**
 * A short-lived HS256 JWT the server mints for its own calls to itself, signed with a key derived
 * from a server secret for one purpose only. Only the server mints it and only the server
 * accepts it; it never leaves the machine.
 */
export class InternalToken {
  private readonly key: Uint8Array;

  constructor(private readonly options: InternalTokenOptions) {
    this.key = Buffer.from(hmacSha256(options.secret, options.keyContext, HEX), HEX);
  }

  issue(subject: string, claims: Record<string, string>): Promise<string> {
    return new SignJWT(claims)
      .setProtectedHeader({ alg: ALGORITHM })
      .setSubject(subject)
      .setIssuer(this.options.issuer)
      .setAudience(this.options.audience)
      .setIssuedAt()
      .setExpirationTime(`${this.options.ttlSeconds}${SECONDS_SUFFIX}`)
      .sign(this.key);
  }

  /** The token's subject and claims, or null when it is forged, expired or malformed. */
  async verify(token: string): Promise<InternalTokenClaims | null> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: [ALGORITHM],
        audience: this.options.audience,
        issuer: this.options.issuer,
      });
      return payload.sub ? { subject: payload.sub, claims: payload } : null;
    } catch {
      return null;
    }
  }
}

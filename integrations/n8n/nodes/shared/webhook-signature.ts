import { createHmac, timingSafeEqual } from 'node:crypto';
import {
	MILLISECONDS_PER_SECOND,
	SIGNATURE_ALGORITHM,
	SIGNATURE_KEY_SEPARATOR,
	SIGNATURE_PART_SEPARATOR,
	SIGNATURE_TIMESTAMP_KEY,
	SIGNATURE_TOLERANCE_SECONDS,
	SIGNATURE_V1_KEY,
	SIGNED_PAYLOAD_SEPARATOR,
} from './crossmart.constants';
import { SignatureFailure } from './crossmart.enums';

const UNIX_SECONDS = /^\d+$/;
const HEX_ENCODING = 'hex';

/** A delivery to check: the endpoint's secret, the signature header and the body as received. */
export type SignedDelivery = {
	/** The whole secret, `whsec_` prefix included. */
	secret: string;
	header: string | undefined;
	rawBody: Buffer;
	/** The current time in unix seconds; the clock's when not given. */
	now?: number;
};

/** The signing time and the signatures of a signature header. */
export type ParsedSignature = {
	timestamp: number;
	signatures: string[];
};

/** Splits `t=<unix seconds>,v1=<hex>[,v1=<hex>]`; undefined when it lacks the time or a signature. */
export function parseSignatureHeader(header: string): ParsedSignature | undefined {
	let timestamp: number | undefined;
	const signatures: string[] = [];
	for (const part of header.split(SIGNATURE_PART_SEPARATOR)) {
		const separatorAt = part.indexOf(SIGNATURE_KEY_SEPARATOR);
		const key = part.slice(0, separatorAt).trim();
		const value = part.slice(separatorAt + 1).trim();
		if (separatorAt < 0 || value === '') continue;
		if (key === SIGNATURE_TIMESTAMP_KEY && UNIX_SECONDS.test(value)) timestamp = Number(value);
		if (key === SIGNATURE_V1_KEY) signatures.push(value);
	}
	if (timestamp === undefined || signatures.length === 0) return undefined;
	return { timestamp, signatures };
}

/** The lowercase hex HMAC-SHA256 of `<timestamp>.<raw body>`, keyed with the secret. */
export function computeSignature(secret: string, timestamp: number, rawBody: Buffer): string {
	return createHmac(SIGNATURE_ALGORITHM, secret)
		.update(`${timestamp}${SIGNED_PAYLOAD_SEPARATOR}`)
		.update(rawBody)
		.digest(HEX_ENCODING);
}

/** Compares in constant time, so the comparison does not leak how much of a signature matched. */
function safeEqual(expected: string, candidate: string): boolean {
	const expectedBytes = Buffer.from(expected);
	const candidateBytes = Buffer.from(candidate.toLowerCase());
	return (
		expectedBytes.length === candidateBytes.length && timingSafeEqual(expectedBytes, candidateBytes)
	);
}

/**
 * Checks a delivery's `Crossmart-Signature` header. It passes when the signing time is within the
 * tolerance and any `v1` signature matches (two during a secret rotation).
 *
 * @returns undefined when the signature is valid, or why it is not.
 */
export function verifySignature(delivery: SignedDelivery): SignatureFailure | undefined {
	if (delivery.header === undefined || delivery.header === '') return SignatureFailure.Missing;
	const parsed = parseSignatureHeader(delivery.header);
	if (parsed === undefined) return SignatureFailure.Malformed;
	const now = delivery.now ?? Math.floor(Date.now() / MILLISECONDS_PER_SECOND);
	if (Math.abs(now - parsed.timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
		return SignatureFailure.Expired;
	}
	const expected = computeSignature(delivery.secret, parsed.timestamp, delivery.rawBody);
	const matches = parsed.signatures.some((signature) => safeEqual(expected, signature));
	return matches ? undefined : SignatureFailure.Mismatch;
}

import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SignatureFailure } from '../nodes/shared/crossmart.enums';
import {
	computeSignature,
	parseSignatureHeader,
	verifySignature,
} from '../nodes/shared/webhook-signature';

const SECRET = 'whsec_test_secret';
const OLD_SECRET = 'whsec_old_secret';
const NOW = 1_793_000_000;
const BODY = Buffer.from('{"id":"evt_1","type":"order.created","data":{}}');

/** Signs like Crossmart: hex HMAC-SHA256 of `<t>.<body>`, keyed with the whole secret. */
const sign = (secret: string, timestamp: number, body: Buffer = BODY): string =>
	createHmac('sha256', secret).update(`${timestamp}.`).update(body).digest('hex');

describe('computeSignature', () => {
	it('matches an HMAC-SHA256 of the time and the raw body, in lowercase hex', () => {
		expect(computeSignature(SECRET, NOW, BODY)).toBe(sign(SECRET, NOW));
		expect(computeSignature(SECRET, NOW, BODY)).toMatch(/^[0-9a-f]{64}$/);
	});
});

describe('parseSignatureHeader', () => {
	it('reads the time and every v1 signature', () => {
		expect(parseSignatureHeader('t=10,v1=aa,v1=bb')).toEqual({
			timestamp: 10,
			signatures: ['aa', 'bb'],
		});
	});

	it('ignores unknown schemes and spaces', () => {
		expect(parseSignatureHeader(' t=10 , v0=zz, v1=aa')).toEqual({
			timestamp: 10,
			signatures: ['aa'],
		});
	});

	it.each(['v1=aa', 't=10', 't=soon,v1=aa', 'garbage'])('rejects %j', (header) => {
		expect(parseSignatureHeader(header)).toBeUndefined();
	});
});

describe('verifySignature', () => {
	const verify = (header: string | undefined, body: Buffer = BODY, now: number = NOW) =>
		verifySignature({ secret: SECRET, header, rawBody: body, now });

	it('accepts a valid signature', () => {
		expect(verify(`t=${NOW},v1=${sign(SECRET, NOW)}`)).toBeUndefined();
	});

	it('accepts any matching v1 signature, as during a secret rotation', () => {
		const header = `t=${NOW},v1=${sign(OLD_SECRET, NOW)},v1=${sign(SECRET, NOW)}`;
		expect(verify(header)).toBeUndefined();
	});

	it('accepts a time within the tolerance', () => {
		expect(verify(`t=${NOW - 300},v1=${sign(SECRET, NOW - 300)}`)).toBeUndefined();
	});

	it('rejects a tampered body', () => {
		const tampered = Buffer.from('{"id":"evt_1","type":"order.created","data":{"x":1}}');
		expect(verify(`t=${NOW},v1=${sign(SECRET, NOW)}`, tampered)).toBe(SignatureFailure.Mismatch);
	});

	it('rejects a signature made with another secret', () => {
		expect(verify(`t=${NOW},v1=${sign(OLD_SECRET, NOW)}`)).toBe(SignatureFailure.Mismatch);
	});

	it('rejects a signature for another time', () => {
		expect(verify(`t=${NOW},v1=${sign(SECRET, NOW - 1)}`)).toBe(SignatureFailure.Mismatch);
	});

	it.each([NOW - 301, NOW + 301])('rejects a delivery signed at %i as expired', (timestamp) => {
		expect(verify(`t=${timestamp},v1=${sign(SECRET, timestamp)}`)).toBe(SignatureFailure.Expired);
	});

	it.each([undefined, ''])('rejects a missing header (%j)', (header) => {
		expect(verify(header)).toBe(SignatureFailure.Missing);
	});

	it('rejects a header without a signature', () => {
		expect(verify(`t=${NOW}`)).toBe(SignatureFailure.Malformed);
	});

	it('uses the clock when no time is given', () => {
		const now = Math.floor(Date.now() / 1000);
		const header = `t=${now},v1=${sign(SECRET, now)}`;
		expect(verifySignature({ secret: SECRET, header, rawBody: BODY })).toBeUndefined();
	});
});

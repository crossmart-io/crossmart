import { describe, expect, it } from 'vitest';
import {
	advanceWatermark,
	failureKey,
	isAfterWatermark,
	rememberIds,
	selectNewFailures,
	selectUnseen,
} from '../nodes/CrossmartTrigger/dedupe';

const T1 = '2026-11-01T10:00:00.000Z';
const T2 = '2026-11-01T10:05:00.000Z';

describe('selectUnseen', () => {
	it('keeps the items whose id was not seen', () => {
		const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
		expect(selectUnseen(items, ['b'], (item) => item.id)).toEqual([{ id: 'a' }, { id: 'c' }]);
	});
});

describe('rememberIds', () => {
	it('puts the newest ids first, without duplicates, up to the maximum', () => {
		expect(rememberIds(['c', 'b', 'a'], ['e', 'd', 'c'], 4)).toEqual(['e', 'd', 'c', 'b']);
	});
});

describe('watermark', () => {
	const state = { watermark: T1, idsAtWatermark: ['a'] };

	it('treats later changes as new', () => {
		expect(isAfterWatermark({ id: 'a', updatedAt: T2 }, state)).toBe(true);
	});

	it('treats a change at the watermark as new only when it was not emitted', () => {
		expect(isAfterWatermark({ id: 'a', updatedAt: T1 }, state)).toBe(false);
		expect(isAfterWatermark({ id: 'b', updatedAt: T1 }, state)).toBe(true);
	});

	it('treats earlier changes as old', () => {
		expect(isAfterWatermark({ id: 'b', updatedAt: '2026-11-01T09:00:00.000Z' }, state)).toBe(false);
	});

	it('moves to the latest change', () => {
		const changes = [
			{ id: 'b', updatedAt: T2 },
			{ id: 'c', updatedAt: T2 },
			{ id: 'd', updatedAt: T1 },
		];
		expect(advanceWatermark(state, changes)).toEqual({ watermark: T2, idsAtWatermark: ['b', 'c'] });
	});

	it('adds to the ids when the latest change is at the same time', () => {
		expect(advanceWatermark(state, [{ id: 'b', updatedAt: T1 }])).toEqual({
			watermark: T1,
			idsAtWatermark: ['a', 'b'],
		});
	});

	it('keeps the watermark when nothing changed', () => {
		expect(advanceWatermark(state, [])).toBe(state);
	});
});

describe('failures', () => {
	it('reports a listing again when it fails with another error', () => {
		const previous = [failureKey({ id: 'l1', lastError: 'Missing brand' })];
		const failures = [
			{ id: 'l1', lastError: 'Missing brand' },
			{ id: 'l1b', lastError: null },
			{ id: 'l2', lastError: 'Price too low' },
		];
		const again = [{ id: 'l1', lastError: 'Category required' }];

		expect(selectNewFailures(failures, previous).map((failure) => failure.id)).toEqual([
			'l1b',
			'l2',
		]);
		expect(selectNewFailures(again, previous)).toEqual(again);
	});
});

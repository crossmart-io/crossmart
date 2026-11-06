import { FAILURE_KEY_SEPARATOR, MAX_REMEMBERED_IDS } from './crossmart-trigger.constants';

/**
 * Pure helpers that decide what a poll emits. The API has no "changed since" filters and no
 * outgoing webhooks yet, so the trigger remembers what it has seen in the workflow's static data.
 */

/** The items whose id is not among the ids already seen. */
export function selectUnseen<Item>(
	items: readonly Item[],
	seenIds: readonly string[],
	idOf: (item: Item) => string,
): Item[] {
	const seen = new Set(seenIds);
	return items.filter((item) => !seen.has(idOf(item)));
}

/** The ids to remember: the newest first, without duplicates, at most `max`. */
export function rememberIds(
	previousIds: readonly string[],
	newestIds: readonly string[],
	max: number = MAX_REMEMBERED_IDS,
): string[] {
	return [...new Set([...newestIds, ...previousIds])].slice(0, max);
}

/** The most recent change the trigger has emitted, and the items changed at that very time. */
export type Watermark = {
	watermark: string;
	idsAtWatermark: string[];
};

export type Timestamped = {
	id: string;
	updatedAt: string;
};

/** Whether an item changed after the watermark (or at it, without being emitted yet). */
export function isAfterWatermark(item: Timestamped, state: Watermark): boolean {
	const changedAt = Date.parse(item.updatedAt);
	const watermarkAt = Date.parse(state.watermark);
	if (changedAt !== watermarkAt) return changedAt > watermarkAt;
	return !state.idsAtWatermark.includes(item.id);
}

/** The watermark after emitting `changes`; the previous one when there are none. */
export function advanceWatermark(
	state: Watermark | undefined,
	changes: readonly Timestamped[],
): Watermark | undefined {
	if (changes.length === 0) return state;
	const latestAt = Math.max(...changes.map((change) => Date.parse(change.updatedAt)));
	const latest = changes.filter((change) => Date.parse(change.updatedAt) === latestAt);
	const sameTime = state !== undefined && Date.parse(state.watermark) === latestAt;
	return {
		watermark: latest[0].updatedAt,
		idsAtWatermark: [
			...new Set([...(sameTime ? state.idsAtWatermark : []), ...latest.map((change) => change.id)]),
		],
	};
}

export type Failure = {
	id: string;
	lastError: string | null;
};

/** Identifies one failure: the same listing failing again with another error is a new failure. */
export function failureKey(failure: Failure): string {
	return `${failure.id}${FAILURE_KEY_SEPARATOR}${failure.lastError ?? ''}`;
}

/** The failures that were not failing at the previous poll. */
export function selectNewFailures<Item extends Failure>(
	failures: readonly Item[],
	previousKeys: readonly string[],
): Item[] {
	return selectUnseen(failures, previousKeys, failureKey);
}

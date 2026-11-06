import type { IDataObject } from 'n8n-workflow';
import type { Watermark } from './dedupe';
import { StateKey } from './crossmart-trigger.enums';

/**
 * Typed access to what the trigger remembers between polls. n8n saves the node's static data
 * after each successful poll of an active workflow.
 */
export class TriggerState {
	constructor(private readonly data: IDataObject) {}

	/** False until the first poll has recorded where the trigger starts from. */
	get initialized(): boolean {
		return this.data[StateKey.Initialized] === true;
	}

	markInitialized(): void {
		this.data[StateKey.Initialized] = true;
	}

	stringList(key: StateKey): string[] {
		const value = this.data[key];
		return Array.isArray(value)
			? value.filter((entry): entry is string => typeof entry === 'string')
			: [];
	}

	setStringList(key: StateKey, values: string[]): void {
		this.data[key] = values;
	}

	watermark(): Watermark | undefined {
		const watermark = this.data[StateKey.Watermark];
		if (typeof watermark !== 'string') return undefined;
		return { watermark, idsAtWatermark: this.stringList(StateKey.IdsAtWatermark) };
	}

	setWatermark(state: Watermark | undefined): void {
		if (state === undefined) return;
		this.data[StateKey.Watermark] = state.watermark;
		this.data[StateKey.IdsAtWatermark] = state.idsAtWatermark;
	}
}

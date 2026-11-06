import type { IDataObject } from 'n8n-workflow';
import type { CrossmartClient } from '../../shared/crossmart-client';
import type { TriggerState } from '../trigger-state';

export type PollContext = {
	client: CrossmartClient;
	state: TriggerState;
	/** Only this store, when the user picked one. */
	connectionId: string | undefined;
};

/** Watches for one kind of event. */
export interface Poller {
	/** What happened since the previous poll, oldest first, and updates the state. */
	poll(context: PollContext): Promise<IDataObject[]>;
	/** The latest matching items, without touching the state, for a manual test run. */
	sample(context: PollContext): Promise<IDataObject[]>;
}

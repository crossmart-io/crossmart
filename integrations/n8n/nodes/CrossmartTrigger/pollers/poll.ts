import type { IDataObject, INodeExecutionData, IPollFunctions } from 'n8n-workflow';
import { CrossmartClient } from '../../shared/crossmart-client';
import { isEnumValue } from '../../shared/parameter-reader';
import { MANUAL_MODE, NODE_STATIC_DATA } from '../crossmart-trigger.constants';
import { TriggerEvent, TriggerParam } from '../crossmart-trigger.enums';
import { TriggerState } from '../trigger-state';
import { ListingFailedPoller } from './listing-failed.poller';
import { NewOrderPoller } from './new-order.poller';
import type { PollContext, Poller } from './poller.types';
import { StockChangedPoller } from './stock-changed.poller';

const POLLERS: Record<TriggerEvent, Poller> = {
	[TriggerEvent.ListingFailed]: new ListingFailedPoller(),
	[TriggerEvent.NewOrder]: new NewOrderPoller(),
	[TriggerEvent.StockChanged]: new StockChangedPoller(),
};

/**
 * One poll of the polling trigger: what happened since the previous poll, or the latest matching
 * item in a manual run ("Fetch Test Event").
 */
export async function pollCrossmart(
	context: IPollFunctions,
): Promise<INodeExecutionData[][] | null> {
	const event = context.getNodeParameter(TriggerParam.Event);
	if (!isEnumValue(TriggerEvent, event)) return null;
	const poller = POLLERS[event];
	const pollContext = await buildPollContext(context);
	const items =
		context.getMode() === MANUAL_MODE
			? await poller.sample(pollContext)
			: await poller.poll(pollContext);
	return items.length > 0 ? [context.helpers.returnJsonArray(items)] : null;
}

async function buildPollContext(context: IPollFunctions): Promise<PollContext> {
	const connectionId = context.getNodeParameter(TriggerParam.ConnectionId, '');
	const staticData: IDataObject = context.getWorkflowStaticData(NODE_STATIC_DATA);
	return {
		client: await CrossmartClient.fromContext(context),
		state: new TriggerState(staticData),
		connectionId:
			typeof connectionId === 'string' && connectionId !== '' ? connectionId : undefined,
	};
}

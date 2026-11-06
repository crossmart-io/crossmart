import type {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { CrossmartClient } from '../shared/crossmart-client';
import { CREDENTIAL_TYPE, EXPRESSION_HINT } from '../shared/crossmart.constants';
import { LoadOptionsMethod } from '../shared/crossmart.enums';
import { isEnumValue } from '../shared/parameter-reader';
import { getStores } from '../shared/store-options';
import { TriggerEvent, TriggerParam } from './crossmart-trigger.enums';
import { ListingFailedPoller } from './pollers/listing-failed.poller';
import { NewOrderPoller } from './pollers/new-order.poller';
import type { PollContext, Poller } from './pollers/poller.types';
import { StockChangedPoller } from './pollers/stock-changed.poller';
import { TriggerState } from './trigger-state';

/* Parameter defaults are named so n8n's linter can read them. */
const DEFAULT_EVENT = TriggerEvent.NewOrder;

/** The n8n mode of a manual test run ("Fetch Test Event"). */
const MANUAL_MODE = 'manual';

/** The static data scope that belongs to this node alone. */
const NODE_STATIC_DATA = 'node';

const POLLERS: Record<TriggerEvent, Poller> = {
	[TriggerEvent.ListingFailed]: new ListingFailedPoller(),
	[TriggerEvent.NewOrder]: new NewOrderPoller(),
	[TriggerEvent.StockChanged]: new StockChangedPoller(),
};

export class CrossmartTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Crossmart Trigger',
		name: 'crossmartTrigger',
		icon: { light: 'file:../../icons/crossmart.svg', dark: 'file:../../icons/crossmart.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts the workflow on new orders, stock changes or failed listings in Crossmart',
		defaults: { name: 'Crossmart Trigger' },
		polling: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: CREDENTIAL_TYPE, required: true }],
		properties: [
			{
				displayName: 'Event',
				name: TriggerParam.Event,
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Listing Failed',
						value: TriggerEvent.ListingFailed,
						description: 'A store rejected a product’s publish or update',
					},
					{
						name: 'New Order',
						value: TriggerEvent.NewOrder,
						description: 'An order came in from a connected store',
					},
					{
						name: 'Stock Changed',
						value: TriggerEvent.StockChanged,
						description: 'A variant’s stock changed, by a sale, an adjustment or an import',
					},
				],
				default: DEFAULT_EVENT,
			},
			{
				displayName: 'Store Name or ID',
				name: TriggerParam.ConnectionId,
				type: 'options',
				typeOptions: { loadOptionsMethod: LoadOptionsMethod.GetStores },
				displayOptions: {
					show: { event: [TriggerEvent.ListingFailed, TriggerEvent.NewOrder] },
				},
				default: '',
				description: `Only this store; leave empty for every store. ${EXPRESSION_HINT}.`,
			},
		],
	};

	methods = {
		loadOptions: { [LoadOptionsMethod.GetStores]: getStores },
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const event = this.getNodeParameter(TriggerParam.Event);
		if (!isEnumValue(TriggerEvent, event)) return null;
		const poller = POLLERS[event];
		const context = await pollContext(this);
		const items =
			this.getMode() === MANUAL_MODE ? await poller.sample(context) : await poller.poll(context);
		return items.length > 0 ? [this.helpers.returnJsonArray(items)] : null;
	}
}

async function pollContext(context: IPollFunctions): Promise<PollContext> {
	const connectionId = context.getNodeParameter(TriggerParam.ConnectionId, '');
	const staticData: IDataObject = context.getWorkflowStaticData(NODE_STATIC_DATA);
	return {
		client: await CrossmartClient.fromContext(context),
		state: new TriggerState(staticData),
		connectionId:
			typeof connectionId === 'string' && connectionId !== '' ? connectionId : undefined,
	};
}

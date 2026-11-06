import type { INodeProperties } from 'n8n-workflow';
import { EXPRESSION_HINT } from '../../shared/crossmart.constants';
import { LoadOptionsMethod } from '../../shared/crossmart.enums';
import { TriggerEvent, TriggerParam } from '../crossmart-trigger.enums';

/* Parameter defaults are named so n8n's linter can read them. */
const DEFAULT_EVENT = TriggerEvent.NewOrder;

/** The parameters of the polling trigger: one event, and a store for the events that have one. */
export const pollingProperties: INodeProperties[] = [
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
];

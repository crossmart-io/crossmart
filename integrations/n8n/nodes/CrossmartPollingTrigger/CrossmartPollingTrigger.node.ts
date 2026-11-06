import type {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { pollCrossmart } from '../CrossmartTrigger/pollers/poll';
import { pollingProperties } from '../CrossmartTrigger/pollers/polling.description';
import { CREDENTIAL_TYPE } from '../shared/crossmart.constants';
import { LoadOptionsMethod } from '../shared/crossmart.enums';
import { getStores } from '../shared/store-options';

/**
 * Polls the Crossmart API on n8n's schedule, for n8n instances Crossmart cannot reach with
 * webhooks (behind a firewall, or without https). Prefer the Crossmart Trigger when it can.
 */
export class CrossmartPollingTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Crossmart Polling Trigger',
		name: 'crossmartPollingTrigger',
		icon: { light: 'file:../../icons/crossmart.svg', dark: 'file:../../icons/crossmart.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description:
			'Checks Crossmart on a schedule for new orders, stock changes or failed listings, when Crossmart cannot reach n8n with webhooks',
		defaults: { name: 'Crossmart Polling Trigger' },
		polling: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: CREDENTIAL_TYPE, required: true }],
		properties: pollingProperties,
	};

	methods = {
		loadOptions: { [LoadOptionsMethod.GetStores]: getStores },
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		return pollCrossmart(this);
	}
}

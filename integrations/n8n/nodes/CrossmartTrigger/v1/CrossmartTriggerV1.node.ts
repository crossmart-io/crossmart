import type {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { CREDENTIAL_TYPE } from '../../shared/crossmart.constants';
import { LoadOptionsMethod } from '../../shared/crossmart.enums';
import { getStores } from '../../shared/store-options';
import { TRIGGER_ICON } from '../crossmart-trigger.constants';
import { pollCrossmart } from '../pollers/poll';
import { pollingProperties } from '../pollers/polling.description';

/**
 * Version 1 of the Crossmart Trigger: the polling trigger, kept so workflows saved with it keep
 * polling. New workflows get version 2 (webhooks), or the Crossmart Polling Trigger node.
 */
export class CrossmartTriggerV1 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Crossmart Trigger',
		name: 'crossmartTrigger',
		icon: TRIGGER_ICON,
		group: ['trigger'],
		description: 'Starts the workflow on new orders, stock changes or failed listings in Crossmart',
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		defaults: { name: 'Crossmart Trigger' },
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

import { VersionedNodeType } from 'n8n-workflow';
import { TRIGGER_ICON } from './crossmart-trigger.constants';
import { CrossmartTriggerV1 } from './v1/CrossmartTriggerV1.node';
import { CrossmartTriggerV2 } from './v2/CrossmartTriggerV2.node';

/** New nodes receive webhooks. */
const DEFAULT_VERSION = 2;

/**
 * Starts a workflow on Crossmart events. Version 2 (the default) receives webhooks; version 1
 * polls, and stays so that workflows saved with it keep working. n8n runs each node with the
 * version it was saved with, so upgrading the package never turns a polling trigger into a
 * webhook one.
 */
export class CrossmartTrigger extends VersionedNodeType {
	constructor() {
		super(
			{ 1: new CrossmartTriggerV1(), 2: new CrossmartTriggerV2() },
			{
				displayName: 'Crossmart Trigger',
				name: 'crossmartTrigger',
				icon: TRIGGER_ICON,
				group: ['trigger'],
				description:
					'Starts the workflow when orders, stock, listings or products change in Crossmart',
				defaultVersion: DEFAULT_VERSION,
			},
		);
	}
}

import type { INodeTypeBaseDescription } from 'n8n-workflow';

/**
 * The Crossmart Trigger's icon. n8n resolves it from the folder of the registered node file
 * (`CrossmartTrigger.node.ts`), for every version.
 */
export const TRIGGER_ICON: INodeTypeBaseDescription['icon'] = {
	light: 'file:../../icons/crossmart.svg',
	dark: 'file:../../icons/crossmart.dark.svg',
};

/** How many order ids the trigger remembers, so an order is never emitted twice. */
export const MAX_REMEMBERED_IDS = 1000;

/** The most pages one poll reads, so a long outage cannot make a poll run for ever. */
export const MAX_PAGES_PER_POLL = 10;

/** How many items a manual run ("Fetch Test Event") returns. */
export const SAMPLE_SIZE = 1;

/** Separates a listing's id from its error in a failure key. */
export const FAILURE_KEY_SEPARATOR = '|';

/** The n8n mode of a manual test run ("Fetch Test Event"). */
export const MANUAL_MODE = 'manual';

/** The static data scope that belongs to this node alone. */
export const NODE_STATIC_DATA = 'node';

/** The name of the trigger's only webhook. */
export const WEBHOOK_NAME = 'default';

/** The path n8n serves the webhook at, after the node's webhook id. */
export const WEBHOOK_PATH = 'webhook';

/**
 * How many delivered event ids the webhook trigger remembers. Delivery is at least once, so a
 * retried event is dropped when its id is among these.
 */
export const MAX_REMEMBERED_EVENT_IDS = 100;

/** Starts the description of the endpoints the trigger creates, so people can tell them apart. */
export const ENDPOINT_DESCRIPTION_PREFIX = 'n8n workflow';

/** The status that answers a delivery whose signature does not check out. */
export const UNAUTHORIZED_STATUS = 401;

/** The status that answers a delivery whose body is not a Crossmart event. */
export const BAD_REQUEST_STATUS = 400;

export const INVALID_SIGNATURE_MESSAGE = 'Invalid Crossmart-Signature';

export const INVALID_EVENT_MESSAGE = 'The body is not a Crossmart event';

/** The answer to a delivery the trigger accepts without starting the workflow. */
export const IGNORED_RESPONSE = { received: true };

export const NO_EVENTS_MESSAGE = 'Choose at least one event';

export const NO_WEBHOOK_URL_MESSAGE = 'n8n has no URL for this trigger’s webhook';

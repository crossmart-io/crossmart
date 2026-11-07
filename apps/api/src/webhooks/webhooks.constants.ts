export const WEBHOOKS_TAG = 'Webhooks';
export const WEBHOOK_ENDPOINTS_ROUTE = 'workspaces/:workspaceId/webhook-endpoints';
export const ENDPOINT_ID_PARAM = 'endpointId';
export const DELIVERY_ID_PARAM = 'deliveryId';
export const ENDPOINT_PATH = `:${ENDPOINT_ID_PARAM}`;
export const ROTATE_SECRET_PATH = `${ENDPOINT_PATH}/rotate-secret`;
export const TEST_EVENT_PATH = `${ENDPOINT_PATH}/test`;
export const DELIVERIES_PATH = `${ENDPOINT_PATH}/deliveries`;
export const DELIVERY_PATH = `${DELIVERIES_PATH}/:${DELIVERY_ID_PARAM}`;
export const REDELIVER_PATH = `${DELIVERY_PATH}/redeliver`;

export const WEBHOOK_DELIVERY_PAGE_DEFAULT_LIMIT = 25;
export const WEBHOOK_DELIVERY_PAGE_MAX_LIMIT = 100;

/** Schema names the generated clients use for the webhook enums. */
export const WEBHOOK_EVENT_TYPE_SCHEMA_NAME = 'WebhookEventType';
export const WEBHOOK_DELIVERY_STATUS_SCHEMA_NAME = 'WebhookDeliveryStatus';
export const WEBHOOK_DISABLED_REASON_SCHEMA_NAME = 'WebhookDisabledReason';
export const WEBHOOK_ATTEMPT_OUTCOME_SCHEMA_NAME = 'WebhookAttemptOutcome';

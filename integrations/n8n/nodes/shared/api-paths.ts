import { API_VERSION_PREFIX } from './crossmart.constants';

const segment = (id: string): string => encodeURIComponent(id);

const workspace = (workspaceId: string): string =>
	`${API_VERSION_PREFIX}/workspaces/${segment(workspaceId)}`;

const store = (workspaceId: string, connectionId: string): string =>
	`${workspace(workspaceId)}/channel-connections/${segment(connectionId)}`;

const product = (workspaceId: string, productId: string): string =>
	`${workspace(workspaceId)}/products/${segment(productId)}`;

const productChannel = (workspaceId: string, productId: string, connectionId: string): string =>
	`${product(workspaceId, productId)}/channels/${segment(connectionId)}`;

const webhookEndpoints = (workspaceId: string): string =>
	`${workspace(workspaceId)}/webhook-endpoints`;

const inventoryItem = (workspaceId: string, inventoryItemId: string): string =>
	`${workspace(workspaceId)}/inventory-items/${segment(inventoryItemId)}`;

/** The REST routes the nodes call. Ids are URL-encoded. */
export const ApiPath = {
	currentApiKey: (): string => `${API_VERSION_PREFIX}/api-key`,

	products: (workspaceId: string): string => `${workspace(workspaceId)}/products`,
	product,

	inventoryItems: (workspaceId: string): string => `${workspace(workspaceId)}/inventory-items`,
	inventoryAdjustments: (workspaceId: string, inventoryItemId: string): string =>
		`${inventoryItem(workspaceId, inventoryItemId)}/adjustments`,
	inventoryMovements: (workspaceId: string, inventoryItemId: string): string =>
		`${inventoryItem(workspaceId, inventoryItemId)}/movements`,

	stores: (workspaceId: string): string => `${workspace(workspaceId)}/channel-connections`,
	store,
	storeSync: (workspaceId: string, connectionId: string): string =>
		`${store(workspaceId, connectionId)}/sync`,
	storeListings: (workspaceId: string, connectionId: string): string =>
		`${store(workspaceId, connectionId)}/listings`,

	productChannels: (workspaceId: string, productId: string): string =>
		`${product(workspaceId, productId)}/channels`,
	productChannel,
	productChannelRetry: (workspaceId: string, productId: string, connectionId: string): string =>
		`${productChannel(workspaceId, productId, connectionId)}/retry`,

	orders: (workspaceId: string): string => `${workspace(workspaceId)}/orders`,
	order: (workspaceId: string, orderId: string): string =>
		`${workspace(workspaceId)}/orders/${segment(orderId)}`,

	webhookEndpoints,
	webhookEndpoint: (workspaceId: string, endpointId: string): string =>
		`${webhookEndpoints(workspaceId)}/${segment(endpointId)}`,
} as const;

import type { z } from 'zod';
import { HttpMethod } from '../../agent-tools/api/api-call.js';
import { AgentToolName, WORKSPACE_PATH } from '../../agent-tools/agent-tools.constants.js';
import { type ApiToolSpec, defineTool } from '../../agent-tools/tools/api-tool.js';
import { ALL_TOOLS } from '../../agent-tools/tools/index.js';
import type { AgentWorkerScope } from '../entities/agent-worker-owner.js';
import type { AgentToolExecutor } from '../tools/agent-tool-executor.js';
import {
  INVENTORY_ITEM_SOURCE,
  type InventoryItemSource,
  LISTING_SOURCE,
  type ListingSource,
  PRODUCT_SOURCE,
  type ProductSource,
  STORE_SOURCE,
  type StoreSource,
  WORKSPACE_SOURCE,
} from './preview-sources.js';

const FIRST_LINE = '\n';

/** The workspace's settings, read for its currency; not a tool the model is offered. */
const WORKSPACE_SPEC = defineTool({
  name: 'get_workspace',
  title: 'Get the workspace',
  description: 'The workspace and its currency.',
  input: {},
  readOnly: true,
  toCall: () => ({ method: HttpMethod.Get, path: WORKSPACE_PATH }),
});

function specNamed(name: AgentToolName): ApiToolSpec {
  const spec = ALL_TOOLS.find((candidate) => candidate.name === name);
  if (!spec) throw new Error(`No agent tool ${name}`);
  return spec;
}

/**
 * What a preview reads, through the same API the change will go through, as the person. Each
 * read happens once per preview, however many values use it.
 */
export class PreviewReader {
  private readonly reads = new Map<string, Promise<unknown>>();

  constructor(
    private readonly executor: AgentToolExecutor,
    private readonly scope: AgentWorkerScope,
  ) {}

  product(productId: string): Promise<ProductSource> {
    return this.read(specNamed(AgentToolName.GetProduct), { productId }, PRODUCT_SOURCE);
  }

  store(connectionId: string): Promise<StoreSource> {
    return this.read(specNamed(AgentToolName.GetStore), { connectionId }, STORE_SOURCE);
  }

  listing(productId: string, connectionId: string): Promise<ListingSource> {
    const input = { productId, connectionId };
    return this.read(specNamed(AgentToolName.GetListing), input, LISTING_SOURCE);
  }

  inventoryItem(inventoryItemId: string): Promise<InventoryItemSource> {
    const spec = specNamed(AgentToolName.GetInventoryItem);
    return this.read(spec, { inventoryItemId }, INVENTORY_ITEM_SOURCE);
  }

  async workspaceCurrency(): Promise<string> {
    return (await this.read(WORKSPACE_SPEC, {}, WORKSPACE_SOURCE)).currency;
  }

  /** The store's currency, or the workspace's when the store's channel does not say. */
  async storeCurrency(connectionId: string): Promise<string> {
    const store = await this.store(connectionId);
    const channels = [store.shopify, store.ebay, store.etsy, store.googleMerchant];
    const currency = channels.find((settings) => settings)?.currencyCode;
    return currency ?? this.workspaceCurrency();
  }

  private read<Source>(
    spec: ApiToolSpec,
    input: Record<string, unknown>,
    schema: z.ZodType<Source>,
  ): Promise<Source> {
    const key = `${spec.name}:${JSON.stringify(input)}`;
    const cached = this.reads.get(key) ?? this.fetch(spec, input, schema);
    this.reads.set(key, cached);
    return cached as Promise<Source>;
  }

  private async fetch<Source>(
    spec: ApiToolSpec,
    input: Record<string, unknown>,
    schema: z.ZodType<Source>,
  ): Promise<Source> {
    const result = await this.executor.execute(this.scope, spec, input);
    if (result.isError) throw new Error(result.text.split(FIRST_LINE)[0]);
    return schema.parse(result.value);
  }
}

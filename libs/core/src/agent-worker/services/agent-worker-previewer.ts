import { Injectable, Logger } from '@nestjs/common';
import type { z } from 'zod';
import { describeError } from '@crossmart/common';
import { AgentToolName } from '../../agent-tools/agent-tools.constants.js';
import type { ApiToolSpec } from '../../agent-tools/tools/api-tool.js';
import { ALL_TOOLS } from '../../agent-tools/tools/index.js';
import type { AgentWorkerScope } from '../entities/agent-worker-owner.js';
import type { AgentWorkerActionPreview } from '../entities/agent-worker-views.js';
import {
  inputChanges,
  LISTING_PREVIEW_SOURCE,
  listingChanges,
  PRODUCT_PREVIEW_SOURCE,
  productChanges,
} from '../rules/action-preview.js';
import { AgentToolExecutor } from '../tools/agent-tool-executor.js';

const PRODUCT_ID_INPUT = 'productId';
const CONNECTION_ID_INPUT = 'connectionId';

function specNamed(name: AgentToolName): ApiToolSpec {
  const spec = ALL_TOOLS.find((candidate) => candidate.name === name);
  if (!spec) throw new Error(`No agent tool ${name}`);
  return spec;
}

/**
 * Shows what a proposed change would do before anyone approves it: for listings and products,
 * the current values read through the API next to the proposed ones; for other tools, the
 * values the call sets. A preview that cannot be read falls back to the latter; it never blocks
 * the proposal.
 */
@Injectable()
export class AgentWorkerPreviewer {
  private readonly logger = new Logger(AgentWorkerPreviewer.name);

  constructor(private readonly executor: AgentToolExecutor) {}

  async preview(
    scope: AgentWorkerScope,
    spec: ApiToolSpec,
    input: Record<string, unknown>,
  ): Promise<AgentWorkerActionPreview> {
    try {
      if (spec.name === AgentToolName.UpdateListing) return await this.listing(scope, input);
      if (spec.name === AgentToolName.ReplaceProduct) return await this.product(scope, input);
    } catch (error) {
      this.logger.warn(`Could not preview ${spec.name}: ${describeError(error)}`);
    }
    return { target: null, changes: inputChanges(input) };
  }

  private async listing(
    scope: AgentWorkerScope,
    input: Record<string, unknown>,
  ): Promise<AgentWorkerActionPreview> {
    const ids = {
      [PRODUCT_ID_INPUT]: input[PRODUCT_ID_INPUT],
      [CONNECTION_ID_INPUT]: input[CONNECTION_ID_INPUT],
    };
    const source = await this.read(scope, AgentToolName.GetListing, ids, LISTING_PREVIEW_SOURCE);
    const target = `${String(source.title.product)} on ${source.connection.displayName}`;
    return { target, changes: listingChanges(source, input) };
  }

  private async product(
    scope: AgentWorkerScope,
    input: Record<string, unknown>,
  ): Promise<AgentWorkerActionPreview> {
    const ids = { [PRODUCT_ID_INPUT]: input[PRODUCT_ID_INPUT] };
    const source = await this.read(scope, AgentToolName.GetProduct, ids, PRODUCT_PREVIEW_SOURCE);
    return { target: source.title, changes: productChanges(source, input) };
  }

  private async read<Source>(
    scope: AgentWorkerScope,
    tool: AgentToolName,
    input: Record<string, unknown>,
    schema: z.ZodType<Source>,
  ): Promise<Source> {
    const result = await this.executor.execute(scope, specNamed(tool), input);
    if (result.isError) throw new Error(result.text.split('\n')[0]);
    return schema.parse(result.value);
  }
}

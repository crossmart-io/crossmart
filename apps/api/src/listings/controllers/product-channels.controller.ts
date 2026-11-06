import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  type Actor,
  ListingOverridesService,
  ListingRetryService,
  ProductChannelsService,
  type StoreMembershipChange,
  StoreMembershipService,
  WorkspacePermission,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  LISTINGS_TAG,
  OVERRIDE_PATH,
  PRODUCT_CHANNEL_PATH,
  PRODUCT_CHANNELS_ROUTE,
  PRODUCT_ID_PARAM,
  RETRY_PATH,
} from '../listings.constants.js';
import { ApiPlanLimitResponse } from '../../entitlements/decorators/api-plan-limit-response.decorator.js';
import { ListingOverrideDto, ListingOverridePatchDto } from '../dto/listing-override.dto.js';
import { ListingRetryErrorDto } from '../dto/listing-retry-error.dto.js';
import { ProductChannelParamsDto } from '../dto/product-channel-params.dto.js';
import { ProductChannelDto } from '../dto/product-channel.dto.js';

/** A product on each connected channel, and what it shows differently there. */
@ApiTags(LISTINGS_TAG)
@Controller(PRODUCT_CHANNELS_ROUTE)
export class ProductChannelsController {
  constructor(
    private readonly channels: ProductChannelsService,
    private readonly overrides: ListingOverridesService,
    private readonly membership: StoreMembershipService,
    private readonly retries: ListingRetryService,
  ) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewChannels)
  @ApiOperation({
    summary: 'The product on each connected channel',
    description:
      'Listing status, channel prices with their explanation, shown stock and overrides.',
  })
  @ApiOkResponse({ type: [ProductChannelDto] })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(PRODUCT_ID_PARAM, ParseUUIDPipe) productId: string,
  ): Promise<ProductChannelDto[]> {
    const views = await this.channels.list(workspaceId, productId);
    return views.map((view) => ProductChannelDto.from(view));
  }

  @Post(PRODUCT_CHANNEL_PATH)
  @RequirePermission(WorkspacePermission.EditListings)
  @ApiOperation({
    summary: 'Add the product to a store',
    description:
      'The product stays in the store until it is removed, whatever the automatic rule says, ' +
      'and is published there at once.',
  })
  @ApiOkResponse({ type: ProductChannelDto })
  async add(
    @Param() target: ProductChannelParamsDto,
    @CurrentActor() actor: Actor,
  ): Promise<ProductChannelDto> {
    await this.membership.add(this.change(target), actor);
    return this.channelView(target);
  }

  @Delete(PRODUCT_CHANNEL_PATH)
  @RequirePermission(WorkspacePermission.EditListings)
  @ApiOperation({
    summary: 'Remove the product from a store',
    description: 'The product is delisted there at once, and the automatic rule leaves it out.',
  })
  @ApiOkResponse({ type: ProductChannelDto })
  async remove(
    @Param() target: ProductChannelParamsDto,
    @CurrentActor() actor: Actor,
  ): Promise<ProductChannelDto> {
    await this.membership.remove(this.change(target), actor);
    return this.channelView(target);
  }

  @Post(RETRY_PATH)
  @HttpCode(HttpStatus.ACCEPTED)
  @RequirePermission(WorkspacePermission.EditListings)
  @ApiOperation({
    summary: 'Publish the product to one store again',
    description:
      'Re-queues this product’s publish (or update) to this store only, unlike `POST …/sync`, ' +
      'which resyncs the whole store. A failed or delisted listing becomes pending at once, so ' +
      'the answer shows `displayState: publishing`; the job runs in the background. Refused ' +
      '(409) when the store is not connected (`code: store_not_connected`: it needs re-auth ' +
      'or was disconnected) or does not select the product (`code: product_not_in_store`), ' +
      'and (402) when the plan has no room for another active listing.',
  })
  @ApiAcceptedResponse({ type: ProductChannelDto })
  @ApiNotFoundResponse({ description: 'The product or the store is not in the workspace' })
  @ApiConflictResponse({
    type: ListingRetryErrorDto,
    description:
      'The store is not connected (`store_not_connected`), or the product is not selected ' +
      'for it (`product_not_in_store`)',
  })
  @ApiPlanLimitResponse()
  async retry(
    @Param() target: ProductChannelParamsDto,
    @CurrentActor() actor: Actor,
  ): Promise<ProductChannelDto> {
    await this.retries.retry(target, actor);
    return this.channelView(target);
  }

  @Put(OVERRIDE_PATH)
  @RequirePermission(WorkspacePermission.EditListings)
  @ApiOperation({
    summary: 'Override the product on one channel',
    description:
      'Replaces the overrides: absent or null fields follow the product. When the channel ' +
      'already lists the product, an update is queued.',
  })
  @ApiOkResponse({ type: ProductChannelDto })
  async saveOverride(
    @Param() target: ProductChannelParamsDto,
    @Body() body: ListingOverrideDto,
    @CurrentActor() actor: Actor,
  ): Promise<ProductChannelDto> {
    await this.overrides.save(target, body.toInput(), actor);
    return this.channelView(target);
  }

  @Patch(OVERRIDE_PATH)
  @RequirePermission(WorkspacePermission.EditListings)
  @ApiOperation({
    summary: 'Change some of the product’s overrides on one channel',
    description:
      'Absent fields keep their override; null reverts a field to the product’s value. Each ' +
      '`variantPrices` entry replaces that variant’s prices only, and both prices null revert ' +
      'the variant to the pricing rule. When the channel already lists the product, an update ' +
      'is queued.',
  })
  @ApiOkResponse({ type: ProductChannelDto })
  async patchOverride(
    @Param() target: ProductChannelParamsDto,
    @Body() body: ListingOverridePatchDto,
    @CurrentActor() actor: Actor,
  ): Promise<ProductChannelDto> {
    await this.overrides.patch(target, body.toPatch(), actor);
    return this.channelView(target);
  }

  @Delete(OVERRIDE_PATH)
  @RequirePermission(WorkspacePermission.EditListings)
  @ApiOperation({ summary: 'Remove the product’s overrides on one channel' })
  @ApiOkResponse({ type: ProductChannelDto })
  async clearOverride(
    @Param() target: ProductChannelParamsDto,
    @CurrentActor() actor: Actor,
  ): Promise<ProductChannelDto> {
    await this.overrides.clear(target, actor);
    return this.channelView(target);
  }

  private change({
    workspaceId,
    connectionId,
    productId,
  }: ProductChannelParamsDto): StoreMembershipChange {
    return { workspaceId, connectionId, productIds: [productId] };
  }

  private async channelView(target: ProductChannelParamsDto): Promise<ProductChannelDto> {
    const { workspaceId, productId, connectionId } = target;
    return ProductChannelDto.from(await this.channels.get(workspaceId, productId, connectionId));
  }
}

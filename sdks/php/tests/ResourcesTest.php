<?php

declare(strict_types=1);

namespace Crossmart\Tests;

use Crossmart\Enum\CompareAtMode;
use Crossmart\Enum\ContentField;
use Crossmart\Enum\InventoryMovementReason;
use Crossmart\Enum\OrderStatus;
use Crossmart\Enum\PriceRounding;
use Crossmart\Enum\SalesRange;
use Crossmart\Enum\StockAdjustmentMode;
use Crossmart\Enum\SuggestionStatus;
use Crossmart\Model\CreateContentDraftDto;
use Crossmart\Model\CreateProductDto;
use Crossmart\Model\CreateVariantDto;
use Crossmart\Model\ListingOverrideDto;
use Crossmart\Model\ListingOverridePatchDto;
use Crossmart\Model\PricingRuleDto;
use Crossmart\Resource\Filter\OrderFilters;
use Crossmart\Resource\Filter\SuggestionFilters;
use DateTimeImmutable;
use DateTimeZone;

/**
 * Each resource method sends the right request and returns the parsed response.
 */
final class ResourcesTest extends TestCase
{
    private const ITEM_ID = '66666666-6666-4666-8666-666666666666';
    private const ORDER_ID = '77777777-7777-4777-8777-777777777777';
    private const SUGGESTION_ID = '88888888-8888-4888-8888-888888888888';
    private const PRODUCT_CHANNEL_PATH = self::WORKSPACE_PATH . '/products/' . self::PRODUCT_ID . '/channels/' . self::STORE_ID;
    private const STORE_PATH = self::WORKSPACE_PATH . '/channel-connections/' . self::STORE_ID;

    public function testCreatesAProductFromAModel(): void
    {
        $this->respond(201, self::fixture('ProductDto'));

        $product = $this->client()->products->create(new CreateProductDto(
            title: 'Mug',
            variants: [new CreateVariantDto(price: '9.00', sku: 'MUG-1')],
        ));

        self::assertSame('POST', $this->lastRequest()->getMethod());
        self::assertSame(self::WORKSPACE_PATH . '/products', $this->lastPath());
        self::assertSame(['title' => 'Mug', 'variants' => [['price' => '9.00', 'sku' => 'MUG-1']]], $this->lastBody());
        self::assertSame('00000000-0000-4000-8000-000000000001', $product->id);
    }

    public function testCreatesAProductFromAnArray(): void
    {
        $this->respond(201, self::fixture('ProductDto'));

        $this->client()->products->create(['title' => 'Mug', 'variants' => [['price' => '9.00']]]);

        self::assertSame(['title' => 'Mug', 'variants' => [['price' => '9.00']]], $this->lastBody());
    }

    public function testReplacesAProduct(): void
    {
        $this->respond(body: self::fixture('ProductDto'));

        $this->client()->products->update(self::PRODUCT_ID, ['title' => 'Mug', 'handle' => 'mug', 'variants' => []]);

        self::assertSame('PUT', $this->lastRequest()->getMethod());
        self::assertSame(['title' => 'Mug', 'handle' => 'mug', 'variants' => []], $this->lastBody());
    }

    public function testDeletesAProduct(): void
    {
        $this->respond(204);

        $this->client()->products->delete(self::PRODUCT_ID);

        self::assertSame('DELETE', $this->lastRequest()->getMethod());
        self::assertSame(self::WORKSPACE_PATH . '/products/' . self::PRODUCT_ID, $this->lastPath());
    }

    public function testAdjustsStock(): void
    {
        $this->respond(body: self::fixture('InventoryItemDto'));

        $this->client()->inventory->adjust(self::ITEM_ID, 12, InventoryMovementReason::Correction, StockAdjustmentMode::Set, 'Count');

        self::assertSame(self::WORKSPACE_PATH . '/inventory-items/' . self::ITEM_ID . '/adjustments', $this->lastPath());
        self::assertSame(['mode' => 'set', 'quantity' => 12, 'reason' => 'CORRECTION', 'note' => 'Count'], $this->lastBody());
    }

    public function testListsStock(): void
    {
        $this->respond(body: self::page([self::fixture('InventoryItemDto')]));

        self::assertSame(1, $this->client()->inventory->list()->total);
    }

    public function testParsesNullNestedObjectsOfAStore(): void
    {
        $this->respond(body: [self::fixture('ChannelConnectionDto')]);

        [$store] = $this->client()->stores->list();

        self::assertNull($store->pricing);
        self::assertNull($store->shopify);
        self::assertEquals(new DateTimeImmutable('2026-01-01T00:00:00Z'), $store->createdAt);
    }

    public function testRemovesAStorePricingRule(): void
    {
        $this->respond(body: self::fixture('ChannelConnectionDto'));

        $this->client()->stores->setPricing(self::STORE_ID, null);

        self::assertSame(self::STORE_PATH . '/pricing', $this->lastPath());
        self::assertSame(['rule' => null], $this->lastBody());
    }

    public function testSetsAStorePricingRule(): void
    {
        $this->respond(body: self::fixture('ChannelConnectionDto'));

        $this->client()->stores->setPricing(self::STORE_ID, new PricingRuleDto(
            adjustmentPercent: '10',
            fixedAmount: '0',
            rounding: PriceRounding::Ending99,
            floor: null,
            compareAt: CompareAtMode::Keep,
        ));

        $body = $this->lastBody();
        self::assertIsArray($body);
        self::assertSame(['adjustmentPercent' => '10', 'fixedAmount' => '0', 'rounding' => 'ending_99', 'floor' => null, 'compareAt' => 'keep'], $body['rule']);
    }

    public function testSyncsAStore(): void
    {
        $this->respond(202, ['queued' => 3, 'delisting' => 1]);

        $this->client()->stores->sync(self::STORE_ID);

        self::assertSame('POST', $this->lastRequest()->getMethod());
        self::assertSame(self::STORE_PATH . '/sync', $this->lastPath());
    }

    public function testPublishesAProduct(): void
    {
        $this->respond(body: self::fixture('ProductChannelDto'));

        $this->client()->listings->publish(self::PRODUCT_ID, self::STORE_ID);

        self::assertSame('POST', $this->lastRequest()->getMethod());
        self::assertSame(self::PRODUCT_CHANNEL_PATH, $this->lastPath());
    }

    public function testRetriesAListing(): void
    {
        $this->respond(202, self::fixture('ProductChannelDto'));

        $this->client()->listings->retry(self::PRODUCT_ID, self::STORE_ID);

        self::assertSame(self::PRODUCT_CHANNEL_PATH . '/retry', $this->lastPath());
    }

    public function testSetsAnOverride(): void
    {
        $this->respond(body: self::fixture('ProductChannelDto'));

        $this->client()->listings->setOverride(self::PRODUCT_ID, self::STORE_ID, new ListingOverrideDto(title: 'Linen apron | Free shipping'));

        self::assertSame('PUT', $this->lastRequest()->getMethod());
        self::assertSame(self::PRODUCT_CHANNEL_PATH . '/override', $this->lastPath());
        self::assertSame(['title' => 'Linen apron | Free shipping'], $this->lastBody());
    }

    public function testPatchesAnOverrideAndRevertsOneField(): void
    {
        $this->respond(body: self::fixture('ProductChannelDto'));

        $this->client()->listings->patchOverride(self::PRODUCT_ID, self::STORE_ID, new ListingOverridePatchDto(title: null, maxQuantity: 5));

        self::assertSame('PATCH', $this->lastRequest()->getMethod());
        self::assertSame(['title' => null, 'maxQuantity' => 5], $this->lastBody());
    }

    public function testPatchesAnOverrideFromAnArray(): void
    {
        $this->respond(body: self::fixture('ProductChannelDto'));

        $this->client()->listings->patchOverride(self::PRODUCT_ID, self::STORE_ID, ['descriptionHtml' => null]);

        self::assertSame(['descriptionHtml' => null], $this->lastBody());
    }

    public function testReadsTheListingEditor(): void
    {
        $this->respond(body: self::fixture('ListingEditorDto'));

        $this->client()->listings->editor(self::PRODUCT_ID, self::STORE_ID);

        self::assertSame(self::PRODUCT_CHANNEL_PATH . '/listing', $this->lastPath());
    }

    public function testPublishesManyProducts(): void
    {
        $this->respond(body: ['count' => 2]);

        $this->client()->listings->publishMany(self::STORE_ID, [self::PRODUCT_ID, self::ITEM_ID]);

        self::assertSame(self::STORE_PATH . '/products/add', $this->lastPath());
        self::assertSame(['productIds' => [self::PRODUCT_ID, self::ITEM_ID]], $this->lastBody());
    }

    public function testListsOrders(): void
    {
        $this->respond(body: self::page([self::fixture('OrderSummaryDto')]));

        $this->client()->orders->list(new OrderFilters(status: OrderStatus::Open, connectionId: self::STORE_ID));

        self::assertSame('status=OPEN&connectionId=' . self::STORE_ID, $this->lastQuery());
    }

    public function testGetsAnOrder(): void
    {
        $this->respond(body: self::fixture('OrderDetailDto'));

        $this->client()->orders->get(self::ORDER_ID);

        self::assertSame(self::WORKSPACE_PATH . '/orders/' . self::ORDER_ID, $this->lastPath());
    }

    public function testReadsTheSalesReport(): void
    {
        $this->respond(body: self::fixture('SalesReportDto'));

        $this->client()->reports->sales(SalesRange::Last7Days, 'America/New_York');

        self::assertSame(self::WORKSPACE_PATH . '/analytics/sales', $this->lastPath());
        self::assertSame('range=last_7_days&timeZone=America%2FNew_York', $this->lastQuery());
    }

    public function testGeneratesContent(): void
    {
        $this->respond(202, ['queued' => 1]);

        $this->client()->ai->generateContent(self::STORE_ID, [self::PRODUCT_ID]);

        self::assertSame(['connectionId' => self::STORE_ID, 'productIds' => [self::PRODUCT_ID]], $this->lastBody());
    }

    public function testDraftsContent(): void
    {
        $this->respond(body: ['title' => 'Shorter title']);

        $this->client()->ai->draftContent(new CreateContentDraftDto(productId: self::PRODUCT_ID, fields: [ContentField::Title], instruction: 'shorter'));

        self::assertSame(['productId' => self::PRODUCT_ID, 'fields' => ['title'], 'instruction' => 'shorter'], $this->lastBody());
    }

    public function testSendsTheUsagePeriodInUtc(): void
    {
        $this->respond(body: self::fixture('AiUsageReportDto'));

        $this->client()->ai->usage(
            new DateTimeImmutable('2026-01-01T02:00:00', new DateTimeZone('+02:00')),
            new DateTimeImmutable('2026-02-01T00:00:00Z'),
        );

        self::assertSame('from=2026-01-01T00%3A00%3A00.000Z&to=2026-02-01T00%3A00%3A00.000Z', $this->lastQuery());
    }

    public function testApprovesASuggestion(): void
    {
        $this->respond(body: self::fixture('SuggestionDto'));

        $this->client()->suggestions->approve(self::SUGGESTION_ID);

        self::assertSame(self::WORKSPACE_PATH . '/suggestions/' . self::SUGGESTION_ID . '/approve', $this->lastPath());
    }

    public function testListsPendingSuggestions(): void
    {
        $this->respond(body: self::page([self::fixture('SuggestionDto')]));

        $page = $this->client()->suggestions->list(new SuggestionFilters(status: SuggestionStatus::Pending));

        self::assertSame('status=PENDING', $this->lastQuery());
        self::assertCount(1, $page->items);
    }

    public function testApprovesManySuggestions(): void
    {
        $this->respond(body: ['items' => [self::fixture('SuggestionDto')], 'skippedIds' => []]);

        $this->client()->suggestions->approveMany([self::SUGGESTION_ID]);

        self::assertSame(['suggestionIds' => [self::SUGGESTION_ID]], $this->lastBody());
    }

    public function testReadsTheCurrentApiKey(): void
    {
        $this->respond(body: self::fixture('CurrentApiKeyDto'));

        $this->client()->workspaces->currentApiKey();

        self::assertSame('/api/v1/api-key', $this->lastPath());
    }

    public function testUpdatesTheWorkspace(): void
    {
        $this->respond(body: self::fixture('WorkspaceDto'));

        $workspace = $this->client()->workspaces->update(['name' => 'Shop']);

        self::assertSame('PATCH', $this->lastRequest()->getMethod());
        self::assertSame(['name' => 'Shop'], $this->lastBody());
        self::assertSame('sample', $workspace->slug);
    }
}

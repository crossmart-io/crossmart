<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Api;

use Crossmart\Http\TransportInterface;

/**
 * Every operation of the API, grouped by tag.
 */
final class ApiClients
{
    public readonly HealthApi $health;
    public readonly WorkspacesApi $workspaces;
    public readonly MembersApi $members;
    public readonly RolesApi $roles;
    public readonly ApiKeysApi $apiKeys;
    public readonly PlansApi $plans;
    public readonly BillingApi $billing;
    public readonly CatalogApi $catalog;
    public readonly ActivityApi $activity;
    public readonly InventoryApi $inventory;
    public readonly ChannelsApi $channels;
    public readonly ListingsApi $listings;
    public readonly OrdersApi $orders;
    public readonly AnalyticsApi $analytics;
    public readonly SuggestionsApi $suggestions;
    public readonly AiApi $ai;
    public readonly AgentsApi $agents;
    public readonly AskCrossmartApi $askCrossmart;
    public readonly AskCrossmartAdminApi $askCrossmartAdmin;
    public readonly SandboxAccountsApi $sandboxAccounts;
    public readonly WebhooksApi $webhooks;

    public function __construct(TransportInterface $transport)
    {
        $this->health = new HealthApi($transport);
        $this->workspaces = new WorkspacesApi($transport);
        $this->members = new MembersApi($transport);
        $this->roles = new RolesApi($transport);
        $this->apiKeys = new ApiKeysApi($transport);
        $this->plans = new PlansApi($transport);
        $this->billing = new BillingApi($transport);
        $this->catalog = new CatalogApi($transport);
        $this->activity = new ActivityApi($transport);
        $this->inventory = new InventoryApi($transport);
        $this->channels = new ChannelsApi($transport);
        $this->listings = new ListingsApi($transport);
        $this->orders = new OrdersApi($transport);
        $this->analytics = new AnalyticsApi($transport);
        $this->suggestions = new SuggestionsApi($transport);
        $this->ai = new AiApi($transport);
        $this->agents = new AgentsApi($transport);
        $this->askCrossmart = new AskCrossmartApi($transport);
        $this->askCrossmartAdmin = new AskCrossmartAdminApi($transport);
        $this->sandboxAccounts = new SandboxAccountsApi($transport);
        $this->webhooks = new WebhooksApi($transport);
    }
}

from enum import StrEnum


class WebhookEventType(StrEnum):
    INVENTORY_STOCK_CHANGED = "inventory.stock_changed"
    LISTING_FAILED = "listing.failed"
    LISTING_PUBLISHED = "listing.published"
    LISTING_REMOVED = "listing.removed"
    ORDER_CREATED = "order.created"
    ORDER_UPDATED = "order.updated"
    PRODUCT_CREATED = "product.created"
    PRODUCT_DELETED = "product.deleted"
    PRODUCT_UPDATED = "product.updated"
    WEBHOOK_TEST = "webhook.test"

    def __str__(self) -> str:
        return str(self.value)

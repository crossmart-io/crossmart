from enum import StrEnum


class PublishRequirement(StrEnum):
    ACCOUNT_SETTINGS = "account_settings"
    ACTIVE_PRODUCT = "active_product"
    CATEGORY = "category"
    IMAGES = "images"
    ITEM_DETAILS = "item_details"
    ITEM_SPECIFICS = "item_specifics"
    LISTING_SETUP = "listing_setup"
    OPTION_NAMES = "option_names"
    PAYMENT_POLICY = "payment_policy"
    PROCESSING_PROFILE = "processing_profile"
    RECONNECT = "reconnect"
    RETURN_POLICY = "return_policy"
    SHIPPING_POLICY = "shipping_policy"
    SHIPPING_PROFILE = "shipping_profile"
    SHIP_FROM_LOCATION = "ship_from_location"

    def __str__(self) -> str:
        return str(self.value)

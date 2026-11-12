from enum import StrEnum


class ChannelType(StrEnum):
    AMAZON = "amazon"
    EBAY = "ebay"
    ETSY = "etsy"
    FALABELLA = "falabella"
    GOOGLE_MERCHANT = "google_merchant"
    SHOPIFY = "shopify"
    WALMART = "walmart"

    def __str__(self) -> str:
        return str(self.value)

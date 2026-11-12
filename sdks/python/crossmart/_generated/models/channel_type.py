from enum import StrEnum


class ChannelType(StrEnum):
    AMAZON = "amazon"
    EBAY = "ebay"
    ETSY = "etsy"
    FALABELLA = "falabella"
    GOOGLE_MERCHANT = "google_merchant"
    MERCADO_LIBRE = "mercado_libre"
    SHOPIFY = "shopify"
    WALMART = "walmart"

    def __str__(self) -> str:
        return str(self.value)

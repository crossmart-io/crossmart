from enum import StrEnum


class EbayMarketplaceId(StrEnum):
    EBAY_AU = "EBAY_AU"
    EBAY_CA = "EBAY_CA"
    EBAY_DE = "EBAY_DE"
    EBAY_ES = "EBAY_ES"
    EBAY_FR = "EBAY_FR"
    EBAY_GB = "EBAY_GB"
    EBAY_IT = "EBAY_IT"
    EBAY_US = "EBAY_US"

    def __str__(self) -> str:
        return str(self.value)

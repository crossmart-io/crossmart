from enum import StrEnum


class GoogleTargetCountry(StrEnum):
    AU = "AU"
    CA = "CA"
    DE = "DE"
    ES = "ES"
    FR = "FR"
    GB = "GB"
    IL = "IL"
    IT = "IT"
    NL = "NL"
    US = "US"

    def __str__(self) -> str:
        return str(self.value)

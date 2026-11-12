from enum import StrEnum


class FalabellaCountry(StrEnum):
    FACL = "facl"
    FACO = "faco"
    FAPE = "fape"

    def __str__(self) -> str:
        return str(self.value)

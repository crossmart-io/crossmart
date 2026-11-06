from enum import StrEnum


class ListingSource(StrEnum):
    IMPORT = "IMPORT"
    MANUAL = "MANUAL"
    RULE = "RULE"

    def __str__(self) -> str:
        return str(self.value)

from enum import StrEnum


class ListingVisibility(StrEnum):
    HIDDEN = "HIDDEN"
    VISIBLE = "VISIBLE"

    def __str__(self) -> str:
        return str(self.value)

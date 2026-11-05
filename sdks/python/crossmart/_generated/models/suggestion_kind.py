from enum import StrEnum


class SuggestionKind(StrEnum):
    LISTING_DESCRIPTION = "listing_description"
    LISTING_TITLE = "listing_title"

    def __str__(self) -> str:
        return str(self.value)

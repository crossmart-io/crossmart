from enum import StrEnum


class CategoryAspectMode(StrEnum):
    FREE_TEXT = "free_text"
    SELECTION_ONLY = "selection_only"

    def __str__(self) -> str:
        return str(self.value)

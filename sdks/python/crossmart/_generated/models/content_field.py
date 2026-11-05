from enum import StrEnum


class ContentField(StrEnum):
    DESCRIPTION = "description"
    TITLE = "title"

    def __str__(self) -> str:
        return str(self.value)

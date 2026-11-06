from enum import StrEnum


class SuggestionAgent(StrEnum):
    CONTENT_GENERATOR = "content_generator"

    def __str__(self) -> str:
        return str(self.value)

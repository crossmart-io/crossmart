from enum import StrEnum


class SuggestionCreatorType(StrEnum):
    AGENT = "AGENT"
    API_KEY = "API_KEY"
    USER = "USER"

    def __str__(self) -> str:
        return str(self.value)

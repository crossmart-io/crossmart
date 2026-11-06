from enum import StrEnum


class AiFeature(StrEnum):
    ASK = "ask"
    CONTENT_DRAFT = "content_draft"
    CONTENT_GENERATION = "content_generation"

    def __str__(self) -> str:
        return str(self.value)

from enum import StrEnum


class AgentClientRegistration(StrEnum):
    DYNAMIC = "dynamic"
    METADATA_DOCUMENT = "metadata_document"

    def __str__(self) -> str:
        return str(self.value)

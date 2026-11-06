from enum import StrEnum


class ActivityActorType(StrEnum):
    AGENT = "AGENT"
    API_KEY = "API_KEY"
    SYSTEM = "SYSTEM"
    USER = "USER"

    def __str__(self) -> str:
        return str(self.value)

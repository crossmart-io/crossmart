from enum import StrEnum


class AskCallerType(StrEnum):
    AGENT = "agent"
    ANONYMOUS = "anonymous"
    API_KEY = "api_key"
    USER = "user"

    def __str__(self) -> str:
        return str(self.value)

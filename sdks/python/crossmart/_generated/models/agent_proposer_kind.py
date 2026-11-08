from enum import StrEnum


class AgentProposerKind(StrEnum):
    API_KEY = "api_key"
    OAUTH_AGENT = "oauth_agent"

    def __str__(self) -> str:
        return str(self.value)

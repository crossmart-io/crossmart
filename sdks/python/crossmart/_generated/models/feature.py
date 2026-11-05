from enum import StrEnum


class Feature(StrEnum):
    ACTIVE_LISTINGS = "active_listings"
    AI_CREDITS = "ai_credits"
    API_KEYS = "api_keys"
    AUTONOMOUS_AGENTS = "autonomous_agents"
    BRING_YOUR_OWN_KEY = "bring_your_own_key"
    CHANNEL_CONNECTIONS = "channel_connections"
    MEMBERS = "members"
    WORKSPACES = "workspaces"

    def __str__(self) -> str:
        return str(self.value)

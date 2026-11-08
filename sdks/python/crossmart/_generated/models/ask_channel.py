from enum import StrEnum


class AskChannel(StrEnum):
    AGENT_WORKER = "agent_worker"
    API = "api"
    APP_WIDGET = "app_widget"
    MCP = "mcp"
    WEB_WIDGET = "web_widget"

    def __str__(self) -> str:
        return str(self.value)

from enum import StrEnum


class ChannelConnectionStatus(StrEnum):
    CONNECTED = "CONNECTED"
    DISCONNECTED = "DISCONNECTED"
    ERROR = "ERROR"
    NEEDS_REAUTH = "NEEDS_REAUTH"

    def __str__(self) -> str:
        return str(self.value)

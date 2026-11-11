from enum import StrEnum


class ChannelProductView(StrEnum):
    ALL = "all"
    LIVE = "live"
    NEEDS_ATTENTION = "needs_attention"
    NOT_LISTED = "not_listed"

    def __str__(self) -> str:
        return str(self.value)

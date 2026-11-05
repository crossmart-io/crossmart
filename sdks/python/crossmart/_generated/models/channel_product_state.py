from enum import StrEnum


class ChannelProductState(StrEnum):
    EXCLUDED = "excluded"
    FAILED = "failed"
    LISTED = "listed"
    PENDING = "pending"
    REMOVED_BY_HAND = "removed_by_hand"
    REMOVING = "removing"

    def __str__(self) -> str:
        return str(self.value)

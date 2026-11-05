from enum import StrEnum


class ChannelProductSort(StrEnum):
    TITLE = "title"
    UPDATEDAT = "updatedAt"

    def __str__(self) -> str:
        return str(self.value)

from enum import StrEnum


class CompareAtMode(StrEnum):
    ADJUST = "adjust"
    KEEP = "keep"
    OMIT = "omit"

    def __str__(self) -> str:
        return str(self.value)

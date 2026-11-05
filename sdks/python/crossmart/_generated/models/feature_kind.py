from enum import StrEnum


class FeatureKind(StrEnum):
    FLAG = "flag"
    LIMIT = "limit"

    def __str__(self) -> str:
        return str(self.value)

from enum import StrEnum


class CategoryAspectUsage(StrEnum):
    OPTIONAL = "optional"
    RECOMMENDED = "recommended"

    def __str__(self) -> str:
        return str(self.value)

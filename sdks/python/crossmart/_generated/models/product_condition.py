from enum import StrEnum


class ProductCondition(StrEnum):
    FOR_PARTS = "FOR_PARTS"
    LIKE_NEW = "LIKE_NEW"
    NEW = "NEW"
    NEW_OTHER = "NEW_OTHER"
    NEW_WITH_DEFECTS = "NEW_WITH_DEFECTS"
    REFURBISHED = "REFURBISHED"
    USED_EXCELLENT = "USED_EXCELLENT"
    USED_FAIR = "USED_FAIR"
    USED_GOOD = "USED_GOOD"
    USED_VERY_GOOD = "USED_VERY_GOOD"

    def __str__(self) -> str:
        return str(self.value)

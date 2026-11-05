from enum import StrEnum


class EntitlementErrorCode(StrEnum):
    PLAN_FEATURE_NOT_INCLUDED = "plan_feature_not_included"
    PLAN_LIMIT_REACHED = "plan_limit_reached"

    def __str__(self) -> str:
        return str(self.value)

from enum import StrEnum


class SubscriptionStatus(StrEnum):
    ACTIVE = "ACTIVE"
    CANCELED = "CANCELED"
    PAST_DUE = "PAST_DUE"
    TRIALING = "TRIALING"

    def __str__(self) -> str:
        return str(self.value)

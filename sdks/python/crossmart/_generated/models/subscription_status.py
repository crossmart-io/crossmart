from enum import StrEnum


class SubscriptionStatus(StrEnum):
    ACTIVE = "ACTIVE"
    CANCELED = "CANCELED"
    INCOMPLETE = "INCOMPLETE"
    PAST_DUE = "PAST_DUE"
    PAUSED = "PAUSED"
    TRIALING = "TRIALING"
    UNPAID = "UNPAID"

    def __str__(self) -> str:
        return str(self.value)

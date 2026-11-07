from enum import StrEnum


class SubscriptionAccessState(StrEnum):
    ACTIVE = "active"
    CANCELED = "canceled"
    LEGACY = "legacy"
    PAST_DUE = "past_due"
    PAST_DUE_GRACE = "past_due_grace"
    PAUSED = "paused"
    SANDBOX = "sandbox"
    SUBSCRIPTION_REQUIRED = "subscription_required"
    TRIALING = "trialing"
    UNPAID = "unpaid"
    UNRESTRICTED = "unrestricted"

    def __str__(self) -> str:
        return str(self.value)

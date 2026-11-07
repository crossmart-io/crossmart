from enum import StrEnum


class BillingInterval(StrEnum):
    ANNUAL = "ANNUAL"
    MONTHLY = "MONTHLY"

    def __str__(self) -> str:
        return str(self.value)

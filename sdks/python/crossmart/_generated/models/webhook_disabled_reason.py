from enum import StrEnum


class WebhookDisabledReason(StrEnum):
    FAILING = "FAILING"
    MANUAL = "MANUAL"

    def __str__(self) -> str:
        return str(self.value)

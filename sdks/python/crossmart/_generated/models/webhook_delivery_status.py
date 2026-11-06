from enum import StrEnum


class WebhookDeliveryStatus(StrEnum):
    FAILED = "FAILED"
    PENDING = "PENDING"
    RETRYING = "RETRYING"
    SUCCEEDED = "SUCCEEDED"

    def __str__(self) -> str:
        return str(self.value)

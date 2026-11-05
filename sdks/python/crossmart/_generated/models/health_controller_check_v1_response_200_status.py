from enum import StrEnum


class HealthControllerCheckV1Response200Status(StrEnum):
    DEGRADED = "degraded"
    OK = "ok"

    def __str__(self) -> str:
        return str(self.value)

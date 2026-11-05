from enum import StrEnum


class HealthControllerCheckV1Response503ErrorType0AdditionalPropertyStatus(StrEnum):
    DEGRADED = "degraded"
    DOWN = "down"
    UP = "up"

    def __str__(self) -> str:
        return str(self.value)

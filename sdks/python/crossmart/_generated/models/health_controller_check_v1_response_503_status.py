from enum import StrEnum


class HealthControllerCheckV1Response503Status(StrEnum):
    ERROR = "error"
    SHUTTING_DOWN = "shutting_down"

    def __str__(self) -> str:
        return str(self.value)

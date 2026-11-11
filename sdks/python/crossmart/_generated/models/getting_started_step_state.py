from enum import StrEnum


class GettingStartedStepState(StrEnum):
    BLOCKED = "blocked"
    DONE = "done"
    TODO = "todo"

    def __str__(self) -> str:
        return str(self.value)

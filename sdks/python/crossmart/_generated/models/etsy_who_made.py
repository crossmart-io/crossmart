from enum import StrEnum


class EtsyWhoMade(StrEnum):
    COLLECTIVE = "collective"
    I_DID = "i_did"
    SOMEONE_ELSE = "someone_else"

    def __str__(self) -> str:
        return str(self.value)

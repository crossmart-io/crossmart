from enum import StrEnum


class MercadoLibreSiteId(StrEnum):
    MCO = "MCO"
    MLA = "MLA"
    MLB = "MLB"
    MLC = "MLC"
    MLM = "MLM"
    MPE = "MPE"

    def __str__(self) -> str:
        return str(self.value)

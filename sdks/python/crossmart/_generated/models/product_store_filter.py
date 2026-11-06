from enum import StrEnum


class ProductStoreFilter(StrEnum):
    IN_NO_STORE = "in_no_store"
    IN_STORE = "in_store"
    NOT_IN_STORE = "not_in_store"
    WITH_ERRORS = "with_errors"

    def __str__(self) -> str:
        return str(self.value)

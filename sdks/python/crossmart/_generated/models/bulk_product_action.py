from enum import StrEnum


class BulkProductAction(StrEnum):
    ADD_TAGS = "add_tags"
    ADJUST_PRICES = "adjust_prices"
    DELETE = "delete"
    REMOVE_TAGS = "remove_tags"
    SET_STATUS = "set_status"

    def __str__(self) -> str:
        return str(self.value)

from enum import StrEnum


class InventoryMovementReason(StrEnum):
    ADJUSTMENT = "ADJUSTMENT"
    CORRECTION = "CORRECTION"
    DAMAGED = "DAMAGED"
    IMPORTED = "IMPORTED"
    LOST = "LOST"
    OPENING_BALANCE = "OPENING_BALANCE"
    ORDER_SHIPPED = "ORDER_SHIPPED"
    RECEIVED = "RECEIVED"
    RETURNED = "RETURNED"
    SOLD = "SOLD"

    def __str__(self) -> str:
        return str(self.value)

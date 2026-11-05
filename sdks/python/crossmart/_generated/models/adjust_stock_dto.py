from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.inventory_movement_reason import InventoryMovementReason
from ..models.stock_adjustment_mode import StockAdjustmentMode
from ..types import UNSET, Unset

T = TypeVar("T", bound="AdjustStockDto")


@_attrs_define
class AdjustStockDto:
    """
    Attributes:
        mode (StockAdjustmentMode):
        quantity (float): With `delta`, units to add (or remove, when negative). With `set`, the new stock on hand.
        reason (InventoryMovementReason): One of RECEIVED, CORRECTION, RETURNED, DAMAGED, LOST, SOLD. The other reasons
            are recorded by Crossmart.
        note (str | Unset):
    """

    mode: StockAdjustmentMode
    quantity: float
    reason: InventoryMovementReason
    note: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        mode = self.mode.value

        quantity = self.quantity

        reason = self.reason.value

        note = self.note

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "mode": mode,
                "quantity": quantity,
                "reason": reason,
            }
        )
        if note is not UNSET:
            field_dict["note"] = note

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        mode = StockAdjustmentMode(d.pop("mode"))

        quantity = d.pop("quantity")

        reason = InventoryMovementReason(d.pop("reason"))

        note = d.pop("note", UNSET)

        adjust_stock_dto = cls(
            mode=mode,
            quantity=quantity,
            reason=reason,
            note=note,
        )

        adjust_stock_dto.additional_properties = d
        return adjust_stock_dto

    @property
    def additional_keys(self) -> list[str]:
        return list(self.additional_properties.keys())

    def __getitem__(self, key: str) -> Any:
        return self.additional_properties[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self.additional_properties[key] = value

    def __delitem__(self, key: str) -> None:
        del self.additional_properties[key]

    def __contains__(self, key: str) -> bool:
        return key in self.additional_properties

from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.inventory_movement_reason import InventoryMovementReason

T = TypeVar("T", bound="InventoryMovementDto")


@_attrs_define
class InventoryMovementDto:
    """
    Attributes:
        id (UUID):
        delta (float): Units added (positive) or removed (negative)
        reason (InventoryMovementReason): One of RECEIVED, CORRECTION, RETURNED, DAMAGED, LOST, SOLD. The other reasons
            are recorded by Crossmart.
        quantity_after (float): Stock on hand right after this movement
        note (None | str):
        user_name (None | str): The user who made the change; null for API keys and changes made by Crossmart
        api_key_name (None | str): The API key that made the change, if any
        created_at (datetime.datetime):
    """

    id: UUID
    delta: float
    reason: InventoryMovementReason
    quantity_after: float
    note: None | str
    user_name: None | str
    api_key_name: None | str
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        delta = self.delta

        reason = self.reason.value

        quantity_after = self.quantity_after

        note: None | str
        note = self.note

        user_name: None | str
        user_name = self.user_name

        api_key_name: None | str
        api_key_name = self.api_key_name

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "delta": delta,
                "reason": reason,
                "quantityAfter": quantity_after,
                "note": note,
                "userName": user_name,
                "apiKeyName": api_key_name,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        id = UUID(d.pop("id"))

        delta = d.pop("delta")

        reason = InventoryMovementReason(d.pop("reason"))

        quantity_after = d.pop("quantityAfter")

        def _parse_note(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        note = _parse_note(d.pop("note"))

        def _parse_user_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        user_name = _parse_user_name(d.pop("userName"))

        def _parse_api_key_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        api_key_name = _parse_api_key_name(d.pop("apiKeyName"))

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        inventory_movement_dto = cls(
            id=id,
            delta=delta,
            reason=reason,
            quantity_after=quantity_after,
            note=note,
            user_name=user_name,
            api_key_name=api_key_name,
            created_at=created_at,
        )

        inventory_movement_dto.additional_properties = d
        return inventory_movement_dto

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

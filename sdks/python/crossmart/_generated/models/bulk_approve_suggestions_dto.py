from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="BulkApproveSuggestionsDto")


@_attrs_define
class BulkApproveSuggestionsDto:
    """
    Attributes:
        suggestion_ids (list[UUID]): Pending suggestions to approve; others are skipped
    """

    suggestion_ids: list[UUID]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        suggestion_ids = []
        for suggestion_ids_item_data in self.suggestion_ids:
            suggestion_ids_item = str(suggestion_ids_item_data)
            suggestion_ids.append(suggestion_ids_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "suggestionIds": suggestion_ids,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        suggestion_ids = []
        _suggestion_ids = d.pop("suggestionIds")
        for suggestion_ids_item_data in _suggestion_ids:
            suggestion_ids_item = UUID(suggestion_ids_item_data)

            suggestion_ids.append(suggestion_ids_item)

        bulk_approve_suggestions_dto = cls(
            suggestion_ids=suggestion_ids,
        )

        bulk_approve_suggestions_dto.additional_properties = d
        return bulk_approve_suggestions_dto

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

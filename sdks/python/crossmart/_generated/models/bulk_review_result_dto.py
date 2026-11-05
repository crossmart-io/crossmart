from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.suggestion_dto import SuggestionDto


T = TypeVar("T", bound="BulkReviewResultDto")


@_attrs_define
class BulkReviewResultDto:
    """
    Attributes:
        items (list[SuggestionDto]): Each suggestion reviewed: `APPLIED`, or `STALE` when its field had changed
        skipped_ids (list[UUID]): Ids not found in the workspace or no longer pending
    """

    items: list[SuggestionDto]
    skipped_ids: list[UUID]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        items = []
        for items_item_data in self.items:
            items_item = items_item_data.to_dict()
            items.append(items_item)

        skipped_ids = []
        for skipped_ids_item_data in self.skipped_ids:
            skipped_ids_item = str(skipped_ids_item_data)
            skipped_ids.append(skipped_ids_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "items": items,
                "skippedIds": skipped_ids,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.suggestion_dto import SuggestionDto

        d = dict(src_dict)
        items = []
        _items = d.pop("items")
        for items_item_data in _items:
            items_item = SuggestionDto.from_dict(items_item_data)

            items.append(items_item)

        skipped_ids = []
        _skipped_ids = d.pop("skippedIds")
        for skipped_ids_item_data in _skipped_ids:
            skipped_ids_item = UUID(skipped_ids_item_data)

            skipped_ids.append(skipped_ids_item)

        bulk_review_result_dto = cls(
            items=items,
            skipped_ids=skipped_ids,
        )

        bulk_review_result_dto.additional_properties = d
        return bulk_review_result_dto

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

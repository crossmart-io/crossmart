from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.listing_display_state import ListingDisplayState

T = TypeVar("T", bound="ListingStateCountDto")


@_attrs_define
class ListingStateCountDto:
    """
    Attributes:
        state (ListingDisplayState): The product on this store, in one state computed by the server: `draft` (not
            selected for the store), `needs_details` (selected, but the store setup or the product lacks something
            publishing needs), `ready` (publishable, not sent yet), `publishing` (queued or in flight, including an update
            of a published listing that a sync or retry queued), `published`, `failed`, `removing` (being taken off) or
            `removed`.
        count (float): Products of the catalog in this state on the store
    """

    state: ListingDisplayState
    count: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        state = self.state.value

        count = self.count

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "state": state,
                "count": count,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        state = ListingDisplayState(d.pop("state"))

        count = d.pop("count")

        listing_state_count_dto = cls(
            state=state,
            count=count,
        )

        listing_state_count_dto.additional_properties = d
        return listing_state_count_dto

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

from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="ChannelProductCountsDto")


@_attrs_define
class ChannelProductCountsDto:
    """
    Attributes:
        listed (float): Selected and on the channel
        pending (float): Selected, waiting for the next sync to publish them
        failed (float): Their last sync failed
        removing (float): On the channel but no longer selected; the next sync delists them
        removed_by_hand (float): Removed by hand and off the channel; adding them back undoes it
        excluded (float): Neither selected nor on the channel
    """

    listed: float
    pending: float
    failed: float
    removing: float
    removed_by_hand: float
    excluded: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        listed = self.listed

        pending = self.pending

        failed = self.failed

        removing = self.removing

        removed_by_hand = self.removed_by_hand

        excluded = self.excluded

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "listed": listed,
                "pending": pending,
                "failed": failed,
                "removing": removing,
                "removed_by_hand": removed_by_hand,
                "excluded": excluded,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        listed = d.pop("listed")

        pending = d.pop("pending")

        failed = d.pop("failed")

        removing = d.pop("removing")

        removed_by_hand = d.pop("removed_by_hand")

        excluded = d.pop("excluded")

        channel_product_counts_dto = cls(
            listed=listed,
            pending=pending,
            failed=failed,
            removing=removing,
            removed_by_hand=removed_by_hand,
            excluded=excluded,
        )

        channel_product_counts_dto.additional_properties = d
        return channel_product_counts_dto

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

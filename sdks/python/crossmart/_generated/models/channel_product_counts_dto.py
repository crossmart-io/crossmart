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
        needs_details (float): Products whose display state is `needs_details`: selected, and the store setup or the
            product lacks something publishing needs. Some may also be counted as `failed`
        needs_attention (float): Products that are failed or need details, each counted once: what
            `view=needs_attention` lists. Its failed part is `failed`, the same listings the attention summary counts
    """

    listed: float
    pending: float
    failed: float
    removing: float
    removed_by_hand: float
    excluded: float
    needs_details: float
    needs_attention: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        listed = self.listed

        pending = self.pending

        failed = self.failed

        removing = self.removing

        removed_by_hand = self.removed_by_hand

        excluded = self.excluded

        needs_details = self.needs_details

        needs_attention = self.needs_attention

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
                "needsDetails": needs_details,
                "needsAttention": needs_attention,
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

        needs_details = d.pop("needsDetails")

        needs_attention = d.pop("needsAttention")

        channel_product_counts_dto = cls(
            listed=listed,
            pending=pending,
            failed=failed,
            removing=removing,
            removed_by_hand=removed_by_hand,
            excluded=excluded,
            needs_details=needs_details,
            needs_attention=needs_attention,
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

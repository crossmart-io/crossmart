from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="SyncRequestResultDto")


@_attrs_define
class SyncRequestResultDto:
    """
    Attributes:
        queued (float): Selected products queued to be published or updated
        delisting (float): Listings queued to be delisted, as they are no longer selected
    """

    queued: float
    delisting: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        queued = self.queued

        delisting = self.delisting

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "queued": queued,
                "delisting": delisting,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        queued = d.pop("queued")

        delisting = d.pop("delisting")

        sync_request_result_dto = cls(
            queued=queued,
            delisting=delisting,
        )

        sync_request_result_dto.additional_properties = d
        return sync_request_result_dto

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

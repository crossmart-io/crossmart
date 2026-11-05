from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

T = TypeVar("T", bound="CreateWorkspaceDto")


@_attrs_define
class CreateWorkspaceDto:
    """
    Attributes:
        name (str):  Example: EU store.
        currency (str | Unset): ISO 4217 code of the catalog prices. It cannot change later. Default: 'USD'. Example:
            EUR.
        time_zone (str | Unset): IANA time zone where the workspace’s day starts, for reports, such as Asia/Jerusalem
            Example: Europe/Berlin.
    """

    name: str
    currency: str | Unset = "USD"
    time_zone: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        name = self.name

        currency = self.currency

        time_zone = self.time_zone

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "name": name,
            }
        )
        if currency is not UNSET:
            field_dict["currency"] = currency
        if time_zone is not UNSET:
            field_dict["timeZone"] = time_zone

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        name = d.pop("name")

        currency = d.pop("currency", UNSET)

        time_zone = d.pop("timeZone", UNSET)

        create_workspace_dto = cls(
            name=name,
            currency=currency,
            time_zone=time_zone,
        )

        create_workspace_dto.additional_properties = d
        return create_workspace_dto

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

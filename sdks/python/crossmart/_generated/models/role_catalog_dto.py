from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.built_in_role_dto import BuiltInRoleDto
    from ..models.custom_role_dto import CustomRoleDto


T = TypeVar("T", bound="RoleCatalogDto")


@_attrs_define
class RoleCatalogDto:
    """
    Attributes:
        built_in (list[BuiltInRoleDto]): Most access first
        custom (list[CustomRoleDto]): By name
    """

    built_in: list[BuiltInRoleDto]
    custom: list[CustomRoleDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        built_in = []
        for built_in_item_data in self.built_in:
            built_in_item = built_in_item_data.to_dict()
            built_in.append(built_in_item)

        custom = []
        for custom_item_data in self.custom:
            custom_item = custom_item_data.to_dict()
            custom.append(custom_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "builtIn": built_in,
                "custom": custom,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.built_in_role_dto import BuiltInRoleDto
        from ..models.custom_role_dto import CustomRoleDto

        d = dict(src_dict)
        built_in = []
        _built_in = d.pop("builtIn")
        for built_in_item_data in _built_in:
            built_in_item = BuiltInRoleDto.from_dict(built_in_item_data)

            built_in.append(built_in_item)

        custom = []
        _custom = d.pop("custom")
        for custom_item_data in _custom:
            custom_item = CustomRoleDto.from_dict(custom_item_data)

            custom.append(custom_item)

        role_catalog_dto = cls(
            built_in=built_in,
            custom=custom,
        )

        role_catalog_dto.additional_properties = d
        return role_catalog_dto

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

from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.category_aspect_mode import CategoryAspectMode
from ..models.category_aspect_usage import CategoryAspectUsage

T = TypeVar("T", bound="CategoryAspectDto")


@_attrs_define
class CategoryAspectDto:
    """
    Attributes:
        name (str):  Example: Color.
        required (bool): The channel refuses listings in the category without it
        usage (CategoryAspectUsage):
        mode (CategoryAspectMode): `selection_only` takes one of `values`; `free_text` takes any text
        multiple (bool): Whether a listing may give it several values
        values (list[str]): The channel’s values, the first ones only
    """

    name: str
    required: bool
    usage: CategoryAspectUsage
    mode: CategoryAspectMode
    multiple: bool
    values: list[str]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        name = self.name

        required = self.required

        usage = self.usage.value

        mode = self.mode.value

        multiple = self.multiple

        values = self.values

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "name": name,
                "required": required,
                "usage": usage,
                "mode": mode,
                "multiple": multiple,
                "values": values,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        name = d.pop("name")

        required = d.pop("required")

        usage = CategoryAspectUsage(d.pop("usage"))

        mode = CategoryAspectMode(d.pop("mode"))

        multiple = d.pop("multiple")

        values = cast(list[str], d.pop("values"))

        category_aspect_dto = cls(
            name=name,
            required=required,
            usage=usage,
            mode=mode,
            multiple=multiple,
            values=values,
        )

        category_aspect_dto.additional_properties = d
        return category_aspect_dto

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

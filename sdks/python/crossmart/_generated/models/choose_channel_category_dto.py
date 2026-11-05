from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.channel_category_dto import ChannelCategoryDto


T = TypeVar("T", bound="ChooseChannelCategoryDto")


@_attrs_define
class ChooseChannelCategoryDto:
    """
    Attributes:
        category (ChannelCategoryDto | None):
    """

    category: ChannelCategoryDto | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.channel_category_dto import ChannelCategoryDto

        category: dict[str, Any] | None
        if isinstance(self.category, ChannelCategoryDto):
            category = self.category.to_dict()
        else:
            category = self.category

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "category": category,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.channel_category_dto import ChannelCategoryDto

        d = dict(src_dict)

        def _parse_category(data: object) -> ChannelCategoryDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                category_type_0 = ChannelCategoryDto.from_dict(data)

                return category_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(ChannelCategoryDto | None, data)

        category = _parse_category(d.pop("category"))

        choose_channel_category_dto = cls(
            category=category,
        )

        choose_channel_category_dto.additional_properties = d
        return choose_channel_category_dto

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

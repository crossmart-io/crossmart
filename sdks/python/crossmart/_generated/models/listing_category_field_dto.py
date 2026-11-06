from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.channel_category_dto import ChannelCategoryDto


T = TypeVar("T", bound="ListingCategoryFieldDto")


@_attrs_define
class ListingCategoryFieldDto:
    """
    Attributes:
        supported (bool): Whether the channel has categories (eBay)
        value (ChannelCategoryDto | None): Null until the merchant chose one or a publish picked one
    """

    supported: bool
    value: ChannelCategoryDto | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.channel_category_dto import ChannelCategoryDto

        supported = self.supported

        value: dict[str, Any] | None
        if isinstance(self.value, ChannelCategoryDto):
            value = self.value.to_dict()
        else:
            value = self.value

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "supported": supported,
                "value": value,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.channel_category_dto import ChannelCategoryDto

        d = dict(src_dict)
        supported = d.pop("supported")

        def _parse_value(data: object) -> ChannelCategoryDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                value_type_0 = ChannelCategoryDto.from_dict(data)

                return value_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(ChannelCategoryDto | None, data)

        value = _parse_value(d.pop("value"))

        listing_category_field_dto = cls(
            supported=supported,
            value=value,
        )

        listing_category_field_dto.additional_properties = d
        return listing_category_field_dto

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

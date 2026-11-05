from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.category_aspect_dto import CategoryAspectDto
    from ..models.channel_category_dto import ChannelCategoryDto
    from ..models.item_specific_dto import ItemSpecificDto


T = TypeVar("T", bound="ListingItemSpecificsDto")


@_attrs_define
class ListingItemSpecificsDto:
    """
    Attributes:
        category (ChannelCategoryDto | None):
        aspects (list[CategoryAspectDto]): Required first, then recommended, then optional; none without a category
        item_specifics (list[ItemSpecificDto]):
    """

    category: ChannelCategoryDto | None
    aspects: list[CategoryAspectDto]
    item_specifics: list[ItemSpecificDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.channel_category_dto import ChannelCategoryDto

        category: dict[str, Any] | None
        if isinstance(self.category, ChannelCategoryDto):
            category = self.category.to_dict()
        else:
            category = self.category

        aspects = []
        for aspects_item_data in self.aspects:
            aspects_item = aspects_item_data.to_dict()
            aspects.append(aspects_item)

        item_specifics = []
        for item_specifics_item_data in self.item_specifics:
            item_specifics_item = item_specifics_item_data.to_dict()
            item_specifics.append(item_specifics_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "category": category,
                "aspects": aspects,
                "itemSpecifics": item_specifics,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.category_aspect_dto import CategoryAspectDto
        from ..models.channel_category_dto import ChannelCategoryDto
        from ..models.item_specific_dto import ItemSpecificDto

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

        aspects = []
        _aspects = d.pop("aspects")
        for aspects_item_data in _aspects:
            aspects_item = CategoryAspectDto.from_dict(aspects_item_data)

            aspects.append(aspects_item)

        item_specifics = []
        _item_specifics = d.pop("itemSpecifics")
        for item_specifics_item_data in _item_specifics:
            item_specifics_item = ItemSpecificDto.from_dict(item_specifics_item_data)

            item_specifics.append(item_specifics_item)

        listing_item_specifics_dto = cls(
            category=category,
            aspects=aspects,
            item_specifics=item_specifics,
        )

        listing_item_specifics_dto.additional_properties = d
        return listing_item_specifics_dto

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

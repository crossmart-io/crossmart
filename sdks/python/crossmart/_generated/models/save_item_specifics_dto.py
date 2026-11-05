from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.item_specific_dto import ItemSpecificDto


T = TypeVar("T", bound="SaveItemSpecificsDto")


@_attrs_define
class SaveItemSpecificsDto:
    """
    Attributes:
        item_specifics (list[ItemSpecificDto]):
    """

    item_specifics: list[ItemSpecificDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        item_specifics = []
        for item_specifics_item_data in self.item_specifics:
            item_specifics_item = item_specifics_item_data.to_dict()
            item_specifics.append(item_specifics_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "itemSpecifics": item_specifics,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.item_specific_dto import ItemSpecificDto

        d = dict(src_dict)
        item_specifics = []
        _item_specifics = d.pop("itemSpecifics")
        for item_specifics_item_data in _item_specifics:
            item_specifics_item = ItemSpecificDto.from_dict(item_specifics_item_data)

            item_specifics.append(item_specifics_item)

        save_item_specifics_dto = cls(
            item_specifics=item_specifics,
        )

        save_item_specifics_dto.additional_properties = d
        return save_item_specifics_dto

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

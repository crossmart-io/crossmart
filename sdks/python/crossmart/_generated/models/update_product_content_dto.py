from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

T = TypeVar("T", bound="UpdateProductContentDto")


@_attrs_define
class UpdateProductContentDto:
    """
    Attributes:
        title (str | Unset):  Example: Linen Shirt – Relaxed Fit.
        description_html (str | Unset): HTML; unsafe markup is removed
    """

    title: str | Unset = UNSET
    description_html: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        title = self.title

        description_html = self.description_html

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if title is not UNSET:
            field_dict["title"] = title
        if description_html is not UNSET:
            field_dict["descriptionHtml"] = description_html

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        title = d.pop("title", UNSET)

        description_html = d.pop("descriptionHtml", UNSET)

        update_product_content_dto = cls(
            title=title,
            description_html=description_html,
        )

        update_product_content_dto.additional_properties = d
        return update_product_content_dto

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

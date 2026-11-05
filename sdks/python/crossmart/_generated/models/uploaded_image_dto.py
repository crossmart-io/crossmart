from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.image_content_type import ImageContentType

T = TypeVar("T", bound="UploadedImageDto")


@_attrs_define
class UploadedImageDto:
    """
    Attributes:
        url (str): Use it as a product media `url`
        content_type (ImageContentType):
        byte_size (float):
    """

    url: str
    content_type: ImageContentType
    byte_size: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        url = self.url

        content_type = self.content_type.value

        byte_size = self.byte_size

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "url": url,
                "contentType": content_type,
                "byteSize": byte_size,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        url = d.pop("url")

        content_type = ImageContentType(d.pop("contentType"))

        byte_size = d.pop("byteSize")

        uploaded_image_dto = cls(
            url=url,
            content_type=content_type,
            byte_size=byte_size,
        )

        uploaded_image_dto.additional_properties = d
        return uploaded_image_dto

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

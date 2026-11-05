from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="MediaDto")


@_attrs_define
class MediaDto:
    """
    Attributes:
        id (UUID):
        url (str):
        alt_text (None | str):
        position (float):
    """

    id: UUID
    url: str
    alt_text: None | str
    position: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        url = self.url

        alt_text: None | str
        alt_text = self.alt_text

        position = self.position

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "url": url,
                "altText": alt_text,
                "position": position,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        id = UUID(d.pop("id"))

        url = d.pop("url")

        def _parse_alt_text(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        alt_text = _parse_alt_text(d.pop("altText"))

        position = d.pop("position")

        media_dto = cls(
            id=id,
            url=url,
            alt_text=alt_text,
            position=position,
        )

        media_dto.additional_properties = d
        return media_dto

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

from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="ContentDraftDto")


@_attrs_define
class ContentDraftDto:
    """
    Attributes:
        title (None | str): Null when not asked for
        description_html (None | str): Null when not asked for
    """

    title: None | str
    description_html: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        title: None | str
        title = self.title

        description_html: None | str
        description_html = self.description_html

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "title": title,
                "descriptionHtml": description_html,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)

        def _parse_title(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        title = _parse_title(d.pop("title"))

        def _parse_description_html(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        description_html = _parse_description_html(d.pop("descriptionHtml"))

        content_draft_dto = cls(
            title=title,
            description_html=description_html,
        )

        content_draft_dto.additional_properties = d
        return content_draft_dto

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

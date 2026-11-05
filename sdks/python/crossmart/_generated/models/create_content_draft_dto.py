from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.content_field import ContentField
from ..types import UNSET, Unset

T = TypeVar("T", bound="CreateContentDraftDto")


@_attrs_define
class CreateContentDraftDto:
    """
    Attributes:
        product_id (UUID):
        fields (list[ContentField]): The fields to rewrite
        connection_id (UUID | Unset): The store the text is for; leave out for the catalog’s own content
        instruction (str | Unset): What to change, such as "shorter" or "mention it is dishwasher-safe"
        title (str | Unset): The title as edited and not yet saved; the saved one when left out
        description_html (str | Unset): The description as edited and not yet saved; the saved one when left out
    """

    product_id: UUID
    fields: list[ContentField]
    connection_id: UUID | Unset = UNSET
    instruction: str | Unset = UNSET
    title: str | Unset = UNSET
    description_html: str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        product_id = str(self.product_id)

        fields = []
        for fields_item_data in self.fields:
            fields_item = fields_item_data.value
            fields.append(fields_item)

        connection_id: str | Unset = UNSET
        if not isinstance(self.connection_id, Unset):
            connection_id = str(self.connection_id)

        instruction = self.instruction

        title = self.title

        description_html = self.description_html

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "productId": product_id,
                "fields": fields,
            }
        )
        if connection_id is not UNSET:
            field_dict["connectionId"] = connection_id
        if instruction is not UNSET:
            field_dict["instruction"] = instruction
        if title is not UNSET:
            field_dict["title"] = title
        if description_html is not UNSET:
            field_dict["descriptionHtml"] = description_html

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        product_id = UUID(d.pop("productId"))

        fields = []
        _fields = d.pop("fields")
        for fields_item_data in _fields:
            fields_item = ContentField(fields_item_data)

            fields.append(fields_item)

        _connection_id = d.pop("connectionId", UNSET)
        connection_id: UUID | Unset
        if isinstance(_connection_id, Unset):
            connection_id = UNSET
        else:
            connection_id = UUID(_connection_id)

        instruction = d.pop("instruction", UNSET)

        title = d.pop("title", UNSET)

        description_html = d.pop("descriptionHtml", UNSET)

        create_content_draft_dto = cls(
            product_id=product_id,
            fields=fields,
            connection_id=connection_id,
            instruction=instruction,
            title=title,
            description_html=description_html,
        )

        create_content_draft_dto.additional_properties = d
        return create_content_draft_dto

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

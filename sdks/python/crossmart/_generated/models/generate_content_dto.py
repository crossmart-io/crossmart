from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="GenerateContentDto")


@_attrs_define
class GenerateContentDto:
    """
    Attributes:
        connection_id (UUID): The store to write for
        product_ids (list[UUID]):
    """

    connection_id: UUID
    product_ids: list[UUID]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        connection_id = str(self.connection_id)

        product_ids = []
        for product_ids_item_data in self.product_ids:
            product_ids_item = str(product_ids_item_data)
            product_ids.append(product_ids_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "connectionId": connection_id,
                "productIds": product_ids,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        connection_id = UUID(d.pop("connectionId"))

        product_ids = []
        _product_ids = d.pop("productIds")
        for product_ids_item_data in _product_ids:
            product_ids_item = UUID(product_ids_item_data)

            product_ids.append(product_ids_item)

        generate_content_dto = cls(
            connection_id=connection_id,
            product_ids=product_ids,
        )

        generate_content_dto.additional_properties = d
        return generate_content_dto

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

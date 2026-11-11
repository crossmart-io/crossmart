from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.suggestion_kind import SuggestionKind

T = TypeVar("T", bound="AttentionSuggestionDto")


@_attrs_define
class AttentionSuggestionDto:
    """
    Attributes:
        id (UUID):
        product_id (UUID):
        product_title (str):
        kind (SuggestionKind):
        connection_id (None | UUID):
        store_name (None | str):
        created_at (datetime.datetime):
    """

    id: UUID
    product_id: UUID
    product_title: str
    kind: SuggestionKind
    connection_id: None | UUID
    store_name: None | str
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        product_id = str(self.product_id)

        product_title = self.product_title

        kind = self.kind.value

        connection_id: None | str
        if isinstance(self.connection_id, UUID):
            connection_id = str(self.connection_id)
        else:
            connection_id = self.connection_id

        store_name: None | str
        store_name = self.store_name

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "productId": product_id,
                "productTitle": product_title,
                "kind": kind,
                "connectionId": connection_id,
                "storeName": store_name,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        id = UUID(d.pop("id"))

        product_id = UUID(d.pop("productId"))

        product_title = d.pop("productTitle")

        kind = SuggestionKind(d.pop("kind"))

        def _parse_connection_id(data: object) -> None | UUID:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                connection_id_type_0 = UUID(data)

                return connection_id_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UUID, data)

        connection_id = _parse_connection_id(d.pop("connectionId"))

        def _parse_store_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        store_name = _parse_store_name(d.pop("storeName"))

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        attention_suggestion_dto = cls(
            id=id,
            product_id=product_id,
            product_title=product_title,
            kind=kind,
            connection_id=connection_id,
            store_name=store_name,
            created_at=created_at,
        )

        attention_suggestion_dto.additional_properties = d
        return attention_suggestion_dto

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

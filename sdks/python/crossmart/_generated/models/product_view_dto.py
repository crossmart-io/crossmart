from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.catalog_gap import CatalogGap
from ..models.product_status import ProductStatus
from ..types import UNSET, Unset

T = TypeVar("T", bound="ProductViewDto")


@_attrs_define
class ProductViewDto:
    """
    Attributes:
        id (UUID):
        name (str):
        created_at (datetime.datetime):
        search (None | str | Unset):
        status (None | ProductStatus | Unset):
        gap (CatalogGap | None | Unset):
    """

    id: UUID
    name: str
    created_at: datetime.datetime
    search: None | str | Unset = UNSET
    status: None | ProductStatus | Unset = UNSET
    gap: CatalogGap | None | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        name = self.name

        created_at = self.created_at.isoformat()

        search: None | str | Unset
        if isinstance(self.search, Unset):
            search = UNSET
        else:
            search = self.search

        status: None | str | Unset
        if isinstance(self.status, Unset):
            status = UNSET
        elif isinstance(self.status, ProductStatus):
            status = self.status.value
        else:
            status = self.status

        gap: None | str | Unset
        if isinstance(self.gap, Unset):
            gap = UNSET
        elif isinstance(self.gap, CatalogGap):
            gap = self.gap.value
        else:
            gap = self.gap

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "name": name,
                "createdAt": created_at,
            }
        )
        if search is not UNSET:
            field_dict["search"] = search
        if status is not UNSET:
            field_dict["status"] = status
        if gap is not UNSET:
            field_dict["gap"] = gap

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        id = UUID(d.pop("id"))

        name = d.pop("name")

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        def _parse_search(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        search = _parse_search(d.pop("search", UNSET))

        def _parse_status(data: object) -> None | ProductStatus | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                status_type_0 = ProductStatus(data)

                return status_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | ProductStatus | Unset, data)

        status = _parse_status(d.pop("status", UNSET))

        def _parse_gap(data: object) -> CatalogGap | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                gap_type_0 = CatalogGap(data)

                return gap_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(CatalogGap | None | Unset, data)

        gap = _parse_gap(d.pop("gap", UNSET))

        product_view_dto = cls(
            id=id,
            name=name,
            created_at=created_at,
            search=search,
            status=status,
            gap=gap,
        )

        product_view_dto.additional_properties = d
        return product_view_dto

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

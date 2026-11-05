from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.catalog_gap import CatalogGap
from ..models.product_status import ProductStatus
from ..types import UNSET, Unset

T = TypeVar("T", bound="CreateProductViewDto")


@_attrs_define
class CreateProductViewDto:
    """
    Attributes:
        name (str): Unique in the workspace
        search (str | Unset): Matches title, handle or SKU
        status (ProductStatus | Unset):
        gap (CatalogGap | Unset):
    """

    name: str
    search: str | Unset = UNSET
    status: ProductStatus | Unset = UNSET
    gap: CatalogGap | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        name = self.name

        search = self.search

        status: str | Unset = UNSET
        if not isinstance(self.status, Unset):
            status = self.status.value

        gap: str | Unset = UNSET
        if not isinstance(self.gap, Unset):
            gap = self.gap.value

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "name": name,
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
        name = d.pop("name")

        search = d.pop("search", UNSET)

        _status = d.pop("status", UNSET)
        status: ProductStatus | Unset
        if isinstance(_status, Unset):
            status = UNSET
        else:
            status = ProductStatus(_status)

        _gap = d.pop("gap", UNSET)
        gap: CatalogGap | Unset
        if isinstance(_gap, Unset):
            gap = UNSET
        else:
            gap = CatalogGap(_gap)

        create_product_view_dto = cls(
            name=name,
            search=search,
            status=status,
            gap=gap,
        )

        create_product_view_dto.additional_properties = d
        return create_product_view_dto

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

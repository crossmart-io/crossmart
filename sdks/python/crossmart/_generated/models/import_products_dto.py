from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.catalog_import_format import CatalogImportFormat
from ..models.catalog_import_mode import CatalogImportMode
from ..types import UNSET, Unset

T = TypeVar("T", bound="ImportProductsDto")


@_attrs_define
class ImportProductsDto:
    """
    Attributes:
        format_ (CatalogImportFormat):
        mode (CatalogImportMode | Unset): `create` adds new products (Shopify CSV), `update` replaces products matched
            by handle (Shopify CSV) and `inventory` sets stock by SKU (inventory CSV) Default: CatalogImportMode.CREATE.
    """

    format_: CatalogImportFormat
    mode: CatalogImportMode | Unset = CatalogImportMode.CREATE
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        format_ = self.format_.value

        mode: str | Unset = UNSET
        if not isinstance(self.mode, Unset):
            mode = self.mode.value

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "format": format_,
            }
        )
        if mode is not UNSET:
            field_dict["mode"] = mode

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        format_ = CatalogImportFormat(d.pop("format"))

        _mode = d.pop("mode", UNSET)
        mode: CatalogImportMode | Unset
        if isinstance(_mode, Unset):
            mode = UNSET
        else:
            mode = CatalogImportMode(_mode)

        import_products_dto = cls(
            format_=format_,
            mode=mode,
        )

        import_products_dto.additional_properties = d
        return import_products_dto

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

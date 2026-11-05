from __future__ import annotations

from collections.abc import Mapping
from io import BytesIO
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from .. import types
from ..models.catalog_import_format import CatalogImportFormat
from ..models.catalog_import_mode import CatalogImportMode
from ..types import UNSET, File, Unset

T = TypeVar("T", bound="ProductImportsControllerImportV1Body")


@_attrs_define
class ProductImportsControllerImportV1Body:
    """
    Attributes:
        format_ (CatalogImportFormat):
        file (File): The catalog file
        mode (CatalogImportMode | Unset): `create` adds new products (Shopify CSV), `update` replaces products matched
            by handle (Shopify CSV) and `inventory` sets stock by SKU (inventory CSV) Default: CatalogImportMode.CREATE.
    """

    format_: CatalogImportFormat
    file: File
    mode: CatalogImportMode | Unset = CatalogImportMode.CREATE
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        format_ = self.format_.value

        file = self.file.to_tuple()

        mode: str | Unset = UNSET
        if not isinstance(self.mode, Unset):
            mode = self.mode.value

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "format": format_,
                "file": file,
            }
        )
        if mode is not UNSET:
            field_dict["mode"] = mode

        return field_dict

    def to_multipart(self) -> types.RequestFiles:
        files: types.RequestFiles = []

        files.append(("format", (None, str(self.format_.value).encode(), "text/plain")))

        files.append(("file", self.file.to_tuple()))

        if not isinstance(self.mode, Unset):
            files.append(("mode", (None, str(self.mode.value).encode(), "text/plain")))

        for prop_name, prop in self.additional_properties.items():
            files.append((prop_name, (None, str(prop).encode(), "text/plain")))

        return files

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        format_ = CatalogImportFormat(d.pop("format"))

        file = File(payload=BytesIO(d.pop("file")))

        _mode = d.pop("mode", UNSET)
        mode: CatalogImportMode | Unset
        if isinstance(_mode, Unset):
            mode = UNSET
        else:
            mode = CatalogImportMode(_mode)

        product_imports_controller_import_v1_body = cls(
            format_=format_,
            file=file,
            mode=mode,
        )

        product_imports_controller_import_v1_body.additional_properties = d
        return product_imports_controller_import_v1_body

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

from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.catalog_import_mode import CatalogImportMode

if TYPE_CHECKING:
    from ..models.import_issue_dto import ImportIssueDto


T = TypeVar("T", bound="CatalogImportResultDto")


@_attrs_define
class CatalogImportResultDto:
    """
    Attributes:
        job_id (UUID): The import history entry of this import
        mode (CatalogImportMode): `create` adds new products (Shopify CSV), `update` replaces products matched by handle
            (Shopify CSV) and `inventory` sets stock by SKU (inventory CSV)
        created_products (float):
        created_variants (float):
        updated_products (float): Products replaced by an update import
        updated_variants (float): Variants whose stock an inventory import set
        skipped (list[ImportIssueDto]): Records left as they were: already in the catalog, not found, stock not tracked
        failed (list[ImportIssueDto]): Records that could not be imported
    """

    job_id: UUID
    mode: CatalogImportMode
    created_products: float
    created_variants: float
    updated_products: float
    updated_variants: float
    skipped: list[ImportIssueDto]
    failed: list[ImportIssueDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        job_id = str(self.job_id)

        mode = self.mode.value

        created_products = self.created_products

        created_variants = self.created_variants

        updated_products = self.updated_products

        updated_variants = self.updated_variants

        skipped = []
        for skipped_item_data in self.skipped:
            skipped_item = skipped_item_data.to_dict()
            skipped.append(skipped_item)

        failed = []
        for failed_item_data in self.failed:
            failed_item = failed_item_data.to_dict()
            failed.append(failed_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "jobId": job_id,
                "mode": mode,
                "createdProducts": created_products,
                "createdVariants": created_variants,
                "updatedProducts": updated_products,
                "updatedVariants": updated_variants,
                "skipped": skipped,
                "failed": failed,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.import_issue_dto import ImportIssueDto

        d = dict(src_dict)
        job_id = UUID(d.pop("jobId"))

        mode = CatalogImportMode(d.pop("mode"))

        created_products = d.pop("createdProducts")

        created_variants = d.pop("createdVariants")

        updated_products = d.pop("updatedProducts")

        updated_variants = d.pop("updatedVariants")

        skipped = []
        _skipped = d.pop("skipped")
        for skipped_item_data in _skipped:
            skipped_item = ImportIssueDto.from_dict(skipped_item_data)

            skipped.append(skipped_item)

        failed = []
        _failed = d.pop("failed")
        for failed_item_data in _failed:
            failed_item = ImportIssueDto.from_dict(failed_item_data)

            failed.append(failed_item)

        catalog_import_result_dto = cls(
            job_id=job_id,
            mode=mode,
            created_products=created_products,
            created_variants=created_variants,
            updated_products=updated_products,
            updated_variants=updated_variants,
            skipped=skipped,
            failed=failed,
        )

        catalog_import_result_dto.additional_properties = d
        return catalog_import_result_dto

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

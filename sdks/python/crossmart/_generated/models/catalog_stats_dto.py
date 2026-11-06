from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.catalog_gap_count_dto import CatalogGapCountDto


T = TypeVar("T", bound="CatalogStatsDto")


@_attrs_define
class CatalogStatsDto:
    """
    Attributes:
        products (float):
        active_products (float):
        draft_products (float):
        archived_products (float):
        variants (float):
        out_of_stock_variants (float): Tracked variants with nothing available
        gaps (list[CatalogGapCountDto]): Products lacking what channels require
    """

    products: float
    active_products: float
    draft_products: float
    archived_products: float
    variants: float
    out_of_stock_variants: float
    gaps: list[CatalogGapCountDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        products = self.products

        active_products = self.active_products

        draft_products = self.draft_products

        archived_products = self.archived_products

        variants = self.variants

        out_of_stock_variants = self.out_of_stock_variants

        gaps = []
        for gaps_item_data in self.gaps:
            gaps_item = gaps_item_data.to_dict()
            gaps.append(gaps_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "products": products,
                "activeProducts": active_products,
                "draftProducts": draft_products,
                "archivedProducts": archived_products,
                "variants": variants,
                "outOfStockVariants": out_of_stock_variants,
                "gaps": gaps,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.catalog_gap_count_dto import CatalogGapCountDto

        d = dict(src_dict)
        products = d.pop("products")

        active_products = d.pop("activeProducts")

        draft_products = d.pop("draftProducts")

        archived_products = d.pop("archivedProducts")

        variants = d.pop("variants")

        out_of_stock_variants = d.pop("outOfStockVariants")

        gaps = []
        _gaps = d.pop("gaps")
        for gaps_item_data in _gaps:
            gaps_item = CatalogGapCountDto.from_dict(gaps_item_data)

            gaps.append(gaps_item)

        catalog_stats_dto = cls(
            products=products,
            active_products=active_products,
            draft_products=draft_products,
            archived_products=archived_products,
            variants=variants,
            out_of_stock_variants=out_of_stock_variants,
            gaps=gaps,
        )

        catalog_stats_dto.additional_properties = d
        return catalog_stats_dto

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

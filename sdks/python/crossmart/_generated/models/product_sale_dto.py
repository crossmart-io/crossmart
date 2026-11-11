from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.product_dto import ProductDto
    from ..models.sold_product_store_dto import SoldProductStoreDto


T = TypeVar("T", bound="ProductSaleDto")


@_attrs_define
class ProductSaleDto:
    """
    Attributes:
        product (ProductDto):
        units_cleared (float): Available units set to 0 across its tracked variants
        removed_from_stores (list[SoldProductStoreDto]): The stores it was taken off. Their listings are ended on the
            channel in the background, like removing a product from a store by hand.
        already_sold (bool): True when it was sold already (no stock left, on no store): nothing changed
    """

    product: ProductDto
    units_cleared: float
    removed_from_stores: list[SoldProductStoreDto]
    already_sold: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        product = self.product.to_dict()

        units_cleared = self.units_cleared

        removed_from_stores = []
        for removed_from_stores_item_data in self.removed_from_stores:
            removed_from_stores_item = removed_from_stores_item_data.to_dict()
            removed_from_stores.append(removed_from_stores_item)

        already_sold = self.already_sold

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "product": product,
                "unitsCleared": units_cleared,
                "removedFromStores": removed_from_stores,
                "alreadySold": already_sold,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.product_dto import ProductDto
        from ..models.sold_product_store_dto import SoldProductStoreDto

        d = dict(src_dict)
        product = ProductDto.from_dict(d.pop("product"))

        units_cleared = d.pop("unitsCleared")

        removed_from_stores = []
        _removed_from_stores = d.pop("removedFromStores")
        for removed_from_stores_item_data in _removed_from_stores:
            removed_from_stores_item = SoldProductStoreDto.from_dict(
                removed_from_stores_item_data
            )

            removed_from_stores.append(removed_from_stores_item)

        already_sold = d.pop("alreadySold")

        product_sale_dto = cls(
            product=product,
            units_cleared=units_cleared,
            removed_from_stores=removed_from_stores,
            already_sold=already_sold,
        )

        product_sale_dto.additional_properties = d
        return product_sale_dto

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

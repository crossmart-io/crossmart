from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.product_status import ProductStatus

if TYPE_CHECKING:
    from ..models.price_range_dto import PriceRangeDto
    from ..models.product_store_badge_dto import ProductStoreBadgeDto


T = TypeVar("T", bound="ProductSummaryDto")


@_attrs_define
class ProductSummaryDto:
    """
    Attributes:
        id (UUID):
        handle (str):
        title (str):
        status (ProductStatus):
        vendor (None | str):
        product_type (None | str):
        variant_count (float):
        total_available (float | None): Stock across variants that track it; null when none do
        price_range (None | PriceRangeDto):
        image_url (None | str):
        stores (list[ProductStoreBadgeDto]): The stores it is in, in the order it joined them
        updated_at (datetime.datetime):
    """

    id: UUID
    handle: str
    title: str
    status: ProductStatus
    vendor: None | str
    product_type: None | str
    variant_count: float
    total_available: float | None
    price_range: None | PriceRangeDto
    image_url: None | str
    stores: list[ProductStoreBadgeDto]
    updated_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.price_range_dto import PriceRangeDto

        id = str(self.id)

        handle = self.handle

        title = self.title

        status = self.status.value

        vendor: None | str
        vendor = self.vendor

        product_type: None | str
        product_type = self.product_type

        variant_count = self.variant_count

        total_available: float | None
        total_available = self.total_available

        price_range: dict[str, Any] | None
        if isinstance(self.price_range, PriceRangeDto):
            price_range = self.price_range.to_dict()
        else:
            price_range = self.price_range

        image_url: None | str
        image_url = self.image_url

        stores = []
        for stores_item_data in self.stores:
            stores_item = stores_item_data.to_dict()
            stores.append(stores_item)

        updated_at = self.updated_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "handle": handle,
                "title": title,
                "status": status,
                "vendor": vendor,
                "productType": product_type,
                "variantCount": variant_count,
                "totalAvailable": total_available,
                "priceRange": price_range,
                "imageUrl": image_url,
                "stores": stores,
                "updatedAt": updated_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.price_range_dto import PriceRangeDto
        from ..models.product_store_badge_dto import ProductStoreBadgeDto

        d = dict(src_dict)
        id = UUID(d.pop("id"))

        handle = d.pop("handle")

        title = d.pop("title")

        status = ProductStatus(d.pop("status"))

        def _parse_vendor(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        vendor = _parse_vendor(d.pop("vendor"))

        def _parse_product_type(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        product_type = _parse_product_type(d.pop("productType"))

        variant_count = d.pop("variantCount")

        def _parse_total_available(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        total_available = _parse_total_available(d.pop("totalAvailable"))

        def _parse_price_range(data: object) -> None | PriceRangeDto:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                price_range_type_0 = PriceRangeDto.from_dict(data)

                return price_range_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | PriceRangeDto, data)

        price_range = _parse_price_range(d.pop("priceRange"))

        def _parse_image_url(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        image_url = _parse_image_url(d.pop("imageUrl"))

        stores = []
        _stores = d.pop("stores")
        for stores_item_data in _stores:
            stores_item = ProductStoreBadgeDto.from_dict(stores_item_data)

            stores.append(stores_item)

        updated_at = datetime.datetime.fromisoformat(d.pop("updatedAt"))

        product_summary_dto = cls(
            id=id,
            handle=handle,
            title=title,
            status=status,
            vendor=vendor,
            product_type=product_type,
            variant_count=variant_count,
            total_available=total_available,
            price_range=price_range,
            image_url=image_url,
            stores=stores,
            updated_at=updated_at,
        )

        product_summary_dto.additional_properties = d
        return product_summary_dto

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

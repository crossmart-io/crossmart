from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.inventory_value_dto import InventoryValueDto
    from ..models.stock_level_counts_dto import StockLevelCountsDto
    from ..models.store_health_dto import StoreHealthDto


T = TypeVar("T", bound="InventoryReportDto")


@_attrs_define
class InventoryReportDto:
    """
    Attributes:
        currency_code (str):  Example: USD.
        value (InventoryValueDto):
        stock_levels (StockLevelCountsDto):
        low_stock_threshold (float): Available units at or below which stock counts as low
        stores (list[StoreHealthDto]): Every store, oldest first
    """

    currency_code: str
    value: InventoryValueDto
    stock_levels: StockLevelCountsDto
    low_stock_threshold: float
    stores: list[StoreHealthDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        currency_code = self.currency_code

        value = self.value.to_dict()

        stock_levels = self.stock_levels.to_dict()

        low_stock_threshold = self.low_stock_threshold

        stores = []
        for stores_item_data in self.stores:
            stores_item = stores_item_data.to_dict()
            stores.append(stores_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "currencyCode": currency_code,
                "value": value,
                "stockLevels": stock_levels,
                "lowStockThreshold": low_stock_threshold,
                "stores": stores,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.inventory_value_dto import InventoryValueDto
        from ..models.stock_level_counts_dto import StockLevelCountsDto
        from ..models.store_health_dto import StoreHealthDto

        d = dict(src_dict)
        currency_code = d.pop("currencyCode")

        value = InventoryValueDto.from_dict(d.pop("value"))

        stock_levels = StockLevelCountsDto.from_dict(d.pop("stockLevels"))

        low_stock_threshold = d.pop("lowStockThreshold")

        stores = []
        _stores = d.pop("stores")
        for stores_item_data in _stores:
            stores_item = StoreHealthDto.from_dict(stores_item_data)

            stores.append(stores_item)

        inventory_report_dto = cls(
            currency_code=currency_code,
            value=value,
            stock_levels=stock_levels,
            low_stock_threshold=low_stock_threshold,
            stores=stores,
        )

        inventory_report_dto.additional_properties = d
        return inventory_report_dto

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

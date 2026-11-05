from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.sales_interval import SalesInterval
from ..models.sales_range import SalesRange

if TYPE_CHECKING:
    from ..models.sales_bucket_dto import SalesBucketDto
    from ..models.sales_store_dto import SalesStoreDto
    from ..models.sales_totals_dto import SalesTotalsDto
    from ..models.top_product_dto import TopProductDto


T = TypeVar("T", bound="SalesReportDto")


@_attrs_define
class SalesReportDto:
    """
    Attributes:
        range_ (SalesRange):
        interval (SalesInterval):
        time_zone (str):  Example: America/New_York.
        currency_code (str): The workspace currency; amounts are in it Example: USD.
        current (SalesTotalsDto):
        previous (SalesTotalsDto):
        buckets (list[SalesBucketDto]):
        stores (list[SalesStoreDto]): Every store, oldest first
        top_products (list[TopProductDto]):
        other_currency_orders (float): Orders in other currencies, which the report leaves out
    """

    range_: SalesRange
    interval: SalesInterval
    time_zone: str
    currency_code: str
    current: SalesTotalsDto
    previous: SalesTotalsDto
    buckets: list[SalesBucketDto]
    stores: list[SalesStoreDto]
    top_products: list[TopProductDto]
    other_currency_orders: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        range_ = self.range_.value

        interval = self.interval.value

        time_zone = self.time_zone

        currency_code = self.currency_code

        current = self.current.to_dict()

        previous = self.previous.to_dict()

        buckets = []
        for buckets_item_data in self.buckets:
            buckets_item = buckets_item_data.to_dict()
            buckets.append(buckets_item)

        stores = []
        for stores_item_data in self.stores:
            stores_item = stores_item_data.to_dict()
            stores.append(stores_item)

        top_products = []
        for top_products_item_data in self.top_products:
            top_products_item = top_products_item_data.to_dict()
            top_products.append(top_products_item)

        other_currency_orders = self.other_currency_orders

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "range": range_,
                "interval": interval,
                "timeZone": time_zone,
                "currencyCode": currency_code,
                "current": current,
                "previous": previous,
                "buckets": buckets,
                "stores": stores,
                "topProducts": top_products,
                "otherCurrencyOrders": other_currency_orders,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.sales_bucket_dto import SalesBucketDto
        from ..models.sales_store_dto import SalesStoreDto
        from ..models.sales_totals_dto import SalesTotalsDto
        from ..models.top_product_dto import TopProductDto

        d = dict(src_dict)
        range_ = SalesRange(d.pop("range"))

        interval = SalesInterval(d.pop("interval"))

        time_zone = d.pop("timeZone")

        currency_code = d.pop("currencyCode")

        current = SalesTotalsDto.from_dict(d.pop("current"))

        previous = SalesTotalsDto.from_dict(d.pop("previous"))

        buckets = []
        _buckets = d.pop("buckets")
        for buckets_item_data in _buckets:
            buckets_item = SalesBucketDto.from_dict(buckets_item_data)

            buckets.append(buckets_item)

        stores = []
        _stores = d.pop("stores")
        for stores_item_data in _stores:
            stores_item = SalesStoreDto.from_dict(stores_item_data)

            stores.append(stores_item)

        top_products = []
        _top_products = d.pop("topProducts")
        for top_products_item_data in _top_products:
            top_products_item = TopProductDto.from_dict(top_products_item_data)

            top_products.append(top_products_item)

        other_currency_orders = d.pop("otherCurrencyOrders")

        sales_report_dto = cls(
            range_=range_,
            interval=interval,
            time_zone=time_zone,
            currency_code=currency_code,
            current=current,
            previous=previous,
            buckets=buckets,
            stores=stores,
            top_products=top_products,
            other_currency_orders=other_currency_orders,
        )

        sales_report_dto.additional_properties = d
        return sales_report_dto

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

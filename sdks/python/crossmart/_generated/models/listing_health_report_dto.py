from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.store_listing_failure_dto import StoreListingFailureDto
    from ..models.store_listing_health_dto import StoreListingHealthDto


T = TypeVar("T", bound="ListingHealthReportDto")


@_attrs_define
class ListingHealthReportDto:
    """
    Attributes:
        stores (list[StoreListingHealthDto]): Every store, oldest first
        recent_failures (list[StoreListingFailureDto]): The latest listings a channel refused, latest first, each with
            its display state and requirement so a client can link to the fix
        failed_listings (float): Failed listings in all, across the stores
    """

    stores: list[StoreListingHealthDto]
    recent_failures: list[StoreListingFailureDto]
    failed_listings: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        stores = []
        for stores_item_data in self.stores:
            stores_item = stores_item_data.to_dict()
            stores.append(stores_item)

        recent_failures = []
        for recent_failures_item_data in self.recent_failures:
            recent_failures_item = recent_failures_item_data.to_dict()
            recent_failures.append(recent_failures_item)

        failed_listings = self.failed_listings

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "stores": stores,
                "recentFailures": recent_failures,
                "failedListings": failed_listings,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.store_listing_failure_dto import StoreListingFailureDto
        from ..models.store_listing_health_dto import StoreListingHealthDto

        d = dict(src_dict)
        stores = []
        _stores = d.pop("stores")
        for stores_item_data in _stores:
            stores_item = StoreListingHealthDto.from_dict(stores_item_data)

            stores.append(stores_item)

        recent_failures = []
        _recent_failures = d.pop("recentFailures")
        for recent_failures_item_data in _recent_failures:
            recent_failures_item = StoreListingFailureDto.from_dict(
                recent_failures_item_data
            )

            recent_failures.append(recent_failures_item)

        failed_listings = d.pop("failedListings")

        listing_health_report_dto = cls(
            stores=stores,
            recent_failures=recent_failures,
            failed_listings=failed_listings,
        )

        listing_health_report_dto.additional_properties = d
        return listing_health_report_dto

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

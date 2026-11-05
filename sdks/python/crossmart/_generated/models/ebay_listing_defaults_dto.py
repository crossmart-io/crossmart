from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.ebay_condition import EbayCondition

if TYPE_CHECKING:
    from ..models.ebay_ship_from_dto import EbayShipFromDto


T = TypeVar("T", bound="EbayListingDefaultsDto")


@_attrs_define
class EbayListingDefaultsDto:
    """
    Attributes:
        fulfillment_policy_id (None | str):
        payment_policy_id (None | str):
        return_policy_id (None | str):
        condition (EbayCondition):
        location (EbayShipFromDto | None):
        merchant_location_key (None | str): The inventory location Crossmart created on eBay for `location`
    """

    fulfillment_policy_id: None | str
    payment_policy_id: None | str
    return_policy_id: None | str
    condition: EbayCondition
    location: EbayShipFromDto | None
    merchant_location_key: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.ebay_ship_from_dto import EbayShipFromDto

        fulfillment_policy_id: None | str
        fulfillment_policy_id = self.fulfillment_policy_id

        payment_policy_id: None | str
        payment_policy_id = self.payment_policy_id

        return_policy_id: None | str
        return_policy_id = self.return_policy_id

        condition = self.condition.value

        location: dict[str, Any] | None
        if isinstance(self.location, EbayShipFromDto):
            location = self.location.to_dict()
        else:
            location = self.location

        merchant_location_key: None | str
        merchant_location_key = self.merchant_location_key

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "fulfillmentPolicyId": fulfillment_policy_id,
                "paymentPolicyId": payment_policy_id,
                "returnPolicyId": return_policy_id,
                "condition": condition,
                "location": location,
                "merchantLocationKey": merchant_location_key,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.ebay_ship_from_dto import EbayShipFromDto

        d = dict(src_dict)

        def _parse_fulfillment_policy_id(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        fulfillment_policy_id = _parse_fulfillment_policy_id(
            d.pop("fulfillmentPolicyId")
        )

        def _parse_payment_policy_id(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        payment_policy_id = _parse_payment_policy_id(d.pop("paymentPolicyId"))

        def _parse_return_policy_id(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        return_policy_id = _parse_return_policy_id(d.pop("returnPolicyId"))

        condition = EbayCondition(d.pop("condition"))

        def _parse_location(data: object) -> EbayShipFromDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                location_type_0 = EbayShipFromDto.from_dict(data)

                return location_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(EbayShipFromDto | None, data)

        location = _parse_location(d.pop("location"))

        def _parse_merchant_location_key(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        merchant_location_key = _parse_merchant_location_key(
            d.pop("merchantLocationKey")
        )

        ebay_listing_defaults_dto = cls(
            fulfillment_policy_id=fulfillment_policy_id,
            payment_policy_id=payment_policy_id,
            return_policy_id=return_policy_id,
            condition=condition,
            location=location,
            merchant_location_key=merchant_location_key,
        )

        ebay_listing_defaults_dto.additional_properties = d
        return ebay_listing_defaults_dto

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

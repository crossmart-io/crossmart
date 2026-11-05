from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.ebay_policy_dto import EbayPolicyDto


T = TypeVar("T", bound="EbayBusinessPoliciesDto")


@_attrs_define
class EbayBusinessPoliciesDto:
    """
    Attributes:
        fulfillment (list[EbayPolicyDto]):
        payment (list[EbayPolicyDto]):
        return_ (list[EbayPolicyDto]):
    """

    fulfillment: list[EbayPolicyDto]
    payment: list[EbayPolicyDto]
    return_: list[EbayPolicyDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        fulfillment = []
        for fulfillment_item_data in self.fulfillment:
            fulfillment_item = fulfillment_item_data.to_dict()
            fulfillment.append(fulfillment_item)

        payment = []
        for payment_item_data in self.payment:
            payment_item = payment_item_data.to_dict()
            payment.append(payment_item)

        return_ = []
        for return_item_data in self.return_:
            return_item = return_item_data.to_dict()
            return_.append(return_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "fulfillment": fulfillment,
                "payment": payment,
                "return": return_,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.ebay_policy_dto import EbayPolicyDto

        d = dict(src_dict)
        fulfillment = []
        _fulfillment = d.pop("fulfillment")
        for fulfillment_item_data in _fulfillment:
            fulfillment_item = EbayPolicyDto.from_dict(fulfillment_item_data)

            fulfillment.append(fulfillment_item)

        payment = []
        _payment = d.pop("payment")
        for payment_item_data in _payment:
            payment_item = EbayPolicyDto.from_dict(payment_item_data)

            payment.append(payment_item)

        return_ = []
        _return_ = d.pop("return")
        for return_item_data in _return_:
            return_item = EbayPolicyDto.from_dict(return_item_data)

            return_.append(return_item)

        ebay_business_policies_dto = cls(
            fulfillment=fulfillment,
            payment=payment,
            return_=return_,
        )

        ebay_business_policies_dto.additional_properties = d
        return ebay_business_policies_dto

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

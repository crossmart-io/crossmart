from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.pricing_rule_dto import PricingRuleDto


T = TypeVar("T", bound="PricingPreviewRequestDto")


@_attrs_define
class PricingPreviewRequestDto:
    """
    Attributes:
        rule (None | PricingRuleDto): The rule to try, saved or not; null shows catalog prices
        product_id (UUID | Unset): The product to price; defaults to the first selected product
    """

    rule: None | PricingRuleDto
    product_id: UUID | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.pricing_rule_dto import PricingRuleDto

        rule: dict[str, Any] | None
        if isinstance(self.rule, PricingRuleDto):
            rule = self.rule.to_dict()
        else:
            rule = self.rule

        product_id: str | Unset = UNSET
        if not isinstance(self.product_id, Unset):
            product_id = str(self.product_id)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "rule": rule,
            }
        )
        if product_id is not UNSET:
            field_dict["productId"] = product_id

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.pricing_rule_dto import PricingRuleDto

        d = dict(src_dict)

        def _parse_rule(data: object) -> None | PricingRuleDto:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                rule_type_0 = PricingRuleDto.from_dict(data)

                return rule_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | PricingRuleDto, data)

        rule = _parse_rule(d.pop("rule"))

        _product_id = d.pop("productId", UNSET)
        product_id: UUID | Unset
        if isinstance(_product_id, Unset):
            product_id = UNSET
        else:
            product_id = UUID(_product_id)

        pricing_preview_request_dto = cls(
            rule=rule,
            product_id=product_id,
        )

        pricing_preview_request_dto.additional_properties = d
        return pricing_preview_request_dto

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

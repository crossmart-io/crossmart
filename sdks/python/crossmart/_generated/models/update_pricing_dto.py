from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.pricing_rule_dto import PricingRuleDto


T = TypeVar("T", bound="UpdatePricingDto")


@_attrs_define
class UpdatePricingDto:
    """
    Attributes:
        rule (None | PricingRuleDto): The rule; null removes it, so catalog prices are sent as they are
    """

    rule: None | PricingRuleDto
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.pricing_rule_dto import PricingRuleDto

        rule: dict[str, Any] | None
        if isinstance(self.rule, PricingRuleDto):
            rule = self.rule.to_dict()
        else:
            rule = self.rule

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "rule": rule,
            }
        )

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

        update_pricing_dto = cls(
            rule=rule,
        )

        update_pricing_dto.additional_properties = d
        return update_pricing_dto

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

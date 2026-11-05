from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.product_selection_rule_dto import ProductSelectionRuleDto


T = TypeVar("T", bound="UpdateProductSelectionDto")


@_attrs_define
class UpdateProductSelectionDto:
    """
    Attributes:
        rule (None | ProductSelectionRuleDto): The selection; null lists every product
    """

    rule: None | ProductSelectionRuleDto
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.product_selection_rule_dto import ProductSelectionRuleDto

        rule: dict[str, Any] | None
        if isinstance(self.rule, ProductSelectionRuleDto):
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
        from ..models.product_selection_rule_dto import ProductSelectionRuleDto

        d = dict(src_dict)

        def _parse_rule(data: object) -> None | ProductSelectionRuleDto:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                rule_type_0 = ProductSelectionRuleDto.from_dict(data)

                return rule_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | ProductSelectionRuleDto, data)

        rule = _parse_rule(d.pop("rule"))

        update_product_selection_dto = cls(
            rule=rule,
        )

        update_product_selection_dto.additional_properties = d
        return update_product_selection_dto

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

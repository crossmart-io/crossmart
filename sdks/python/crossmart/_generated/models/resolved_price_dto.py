from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.price_source import PriceSource
from ..models.price_warning import PriceWarning

if TYPE_CHECKING:
    from ..models.price_step_dto import PriceStepDto


T = TypeVar("T", bound="ResolvedPriceDto")


@_attrs_define
class ResolvedPriceDto:
    """
    Attributes:
        price (str):  Example: 102.99.
        compare_at_price (None | str):
        source (PriceSource):
        steps (list[PriceStepDto]):
        explanation (str):  Example: $89.00 → +15% → .99 = $102.99.
        warnings (list[PriceWarning]):
        unit_cost (None | str): The variant cost in the channel currency, converted like the price
    """

    price: str
    compare_at_price: None | str
    source: PriceSource
    steps: list[PriceStepDto]
    explanation: str
    warnings: list[PriceWarning]
    unit_cost: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        price = self.price

        compare_at_price: None | str
        compare_at_price = self.compare_at_price

        source = self.source.value

        steps = []
        for steps_item_data in self.steps:
            steps_item = steps_item_data.to_dict()
            steps.append(steps_item)

        explanation = self.explanation

        warnings = []
        for warnings_item_data in self.warnings:
            warnings_item = warnings_item_data.value
            warnings.append(warnings_item)

        unit_cost: None | str
        unit_cost = self.unit_cost

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "price": price,
                "compareAtPrice": compare_at_price,
                "source": source,
                "steps": steps,
                "explanation": explanation,
                "warnings": warnings,
                "unitCost": unit_cost,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.price_step_dto import PriceStepDto

        d = dict(src_dict)
        price = d.pop("price")

        def _parse_compare_at_price(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        compare_at_price = _parse_compare_at_price(d.pop("compareAtPrice"))

        source = PriceSource(d.pop("source"))

        steps = []
        _steps = d.pop("steps")
        for steps_item_data in _steps:
            steps_item = PriceStepDto.from_dict(steps_item_data)

            steps.append(steps_item)

        explanation = d.pop("explanation")

        warnings = []
        _warnings = d.pop("warnings")
        for warnings_item_data in _warnings:
            warnings_item = PriceWarning(warnings_item_data)

            warnings.append(warnings_item)

        def _parse_unit_cost(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        unit_cost = _parse_unit_cost(d.pop("unitCost"))

        resolved_price_dto = cls(
            price=price,
            compare_at_price=compare_at_price,
            source=source,
            steps=steps,
            explanation=explanation,
            warnings=warnings,
            unit_cost=unit_cost,
        )

        resolved_price_dto.additional_properties = d
        return resolved_price_dto

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

from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.compare_at_mode import CompareAtMode
from ..models.price_rounding import PriceRounding
from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.pricing_floor_dto import PricingFloorDto


T = TypeVar("T", bound="PricingRuleDto")


@_attrs_define
class PricingRuleDto:
    """
    Attributes:
        adjustment_percent (str): Markup (positive) or discount (negative), -90 to 500 Example: 15.
        fixed_amount (str): Added after the percentage; may be negative Example: 0.
        rounding (PriceRounding):
        floor (None | PricingFloorDto):
        compare_at (CompareAtMode):
        fixed_exchange_rate (None | str | Unset): Store-currency units per catalog-currency unit, used instead of the
            ECB daily rate. Only applies when the store sells in another currency than the workspace. Example: 0.92.
    """

    adjustment_percent: str
    fixed_amount: str
    rounding: PriceRounding
    floor: None | PricingFloorDto
    compare_at: CompareAtMode
    fixed_exchange_rate: None | str | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.pricing_floor_dto import PricingFloorDto

        adjustment_percent = self.adjustment_percent

        fixed_amount = self.fixed_amount

        rounding = self.rounding.value

        floor: dict[str, Any] | None
        if isinstance(self.floor, PricingFloorDto):
            floor = self.floor.to_dict()
        else:
            floor = self.floor

        compare_at = self.compare_at.value

        fixed_exchange_rate: None | str | Unset
        if isinstance(self.fixed_exchange_rate, Unset):
            fixed_exchange_rate = UNSET
        else:
            fixed_exchange_rate = self.fixed_exchange_rate

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "adjustmentPercent": adjustment_percent,
                "fixedAmount": fixed_amount,
                "rounding": rounding,
                "floor": floor,
                "compareAt": compare_at,
            }
        )
        if fixed_exchange_rate is not UNSET:
            field_dict["fixedExchangeRate"] = fixed_exchange_rate

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.pricing_floor_dto import PricingFloorDto

        d = dict(src_dict)
        adjustment_percent = d.pop("adjustmentPercent")

        fixed_amount = d.pop("fixedAmount")

        rounding = PriceRounding(d.pop("rounding"))

        def _parse_floor(data: object) -> None | PricingFloorDto:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                floor_type_0 = PricingFloorDto.from_dict(data)

                return floor_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | PricingFloorDto, data)

        floor = _parse_floor(d.pop("floor"))

        compare_at = CompareAtMode(d.pop("compareAt"))

        def _parse_fixed_exchange_rate(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        fixed_exchange_rate = _parse_fixed_exchange_rate(
            d.pop("fixedExchangeRate", UNSET)
        )

        pricing_rule_dto = cls(
            adjustment_percent=adjustment_percent,
            fixed_amount=fixed_amount,
            rounding=rounding,
            floor=floor,
            compare_at=compare_at,
            fixed_exchange_rate=fixed_exchange_rate,
        )

        pricing_rule_dto.additional_properties = d
        return pricing_rule_dto

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

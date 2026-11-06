from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.listing_visibility import ListingVisibility

T = TypeVar("T", bound="InheritedVisibilityDto")


@_attrs_define
class InheritedVisibilityDto:
    """
    Attributes:
        product (ListingVisibility):
        override (ListingVisibility | None):
        effective (ListingVisibility):
        overridden (bool): Whether the store overrides it; reverting sets `override` to null
    """

    product: ListingVisibility
    override: ListingVisibility | None
    effective: ListingVisibility
    overridden: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        product = self.product.value

        override: None | str
        if isinstance(self.override, ListingVisibility):
            override = self.override.value
        else:
            override = self.override

        effective = self.effective.value

        overridden = self.overridden

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "product": product,
                "override": override,
                "effective": effective,
                "overridden": overridden,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        product = ListingVisibility(d.pop("product"))

        def _parse_override(data: object) -> ListingVisibility | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                override_type_0 = ListingVisibility(data)

                return override_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(ListingVisibility | None, data)

        override = _parse_override(d.pop("override"))

        effective = ListingVisibility(d.pop("effective"))

        overridden = d.pop("overridden")

        inherited_visibility_dto = cls(
            product=product,
            override=override,
            effective=effective,
            overridden=overridden,
        )

        inherited_visibility_dto.additional_properties = d
        return inherited_visibility_dto

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

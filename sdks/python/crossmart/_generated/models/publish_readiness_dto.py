from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.publish_requirement import PublishRequirement

T = TypeVar("T", bound="PublishReadinessDto")


@_attrs_define
class PublishReadinessDto:
    """
    Attributes:
        ready (bool): True when listings can be published to this store
        missing (list[PublishRequirement]): What to finish before publishing, in order; empty when ready. `reconnect`
            alone when the store needs to be connected again. eBay: `shipping_policy`, `payment_policy`, `return_policy`,
            `ship_from_location`. Google: `listing_setup`. Etsy: `item_details`, `shipping_profile`, `processing_profile`.
            `account_settings` when the account was never read. Example: ['shipping_policy', 'ship_from_location'].
    """

    ready: bool
    missing: list[PublishRequirement]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        ready = self.ready

        missing = []
        for missing_item_data in self.missing:
            missing_item = missing_item_data.value
            missing.append(missing_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "ready": ready,
                "missing": missing,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        ready = d.pop("ready")

        missing = []
        _missing = d.pop("missing")
        for missing_item_data in _missing:
            missing_item = PublishRequirement(missing_item_data)

            missing.append(missing_item)

        publish_readiness_dto = cls(
            ready=ready,
            missing=missing,
        )

        publish_readiness_dto.additional_properties = d
        return publish_readiness_dto

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

from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.feature import Feature
from ..models.feature_kind import FeatureKind

T = TypeVar("T", bound="FeatureUsageDto")


@_attrs_define
class FeatureUsageDto:
    """
    Attributes:
        feature (Feature):
        kind (FeatureKind): A counted limit, or a flag the plan turns on or off
        enabled (bool): Whether the plan includes the feature at all
        limit (float | None): How many the plan allows; null is unlimited, 0 is not included
        usage (float | None): How many are in use now, across the organization; null for flags
    """

    feature: Feature
    kind: FeatureKind
    enabled: bool
    limit: float | None
    usage: float | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        feature = self.feature.value

        kind = self.kind.value

        enabled = self.enabled

        limit: float | None
        limit = self.limit

        usage: float | None
        usage = self.usage

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "feature": feature,
                "kind": kind,
                "enabled": enabled,
                "limit": limit,
                "usage": usage,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        feature = Feature(d.pop("feature"))

        kind = FeatureKind(d.pop("kind"))

        enabled = d.pop("enabled")

        def _parse_limit(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        limit = _parse_limit(d.pop("limit"))

        def _parse_usage(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        usage = _parse_usage(d.pop("usage"))

        feature_usage_dto = cls(
            feature=feature,
            kind=kind,
            enabled=enabled,
            limit=limit,
            usage=usage,
        )

        feature_usage_dto.additional_properties = d
        return feature_usage_dto

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

from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.ai_feature import AiFeature

T = TypeVar("T", bound="AiUsageLineDto")


@_attrs_define
class AiUsageLineDto:
    """
    Attributes:
        calls (float):
        input_tokens (float):
        output_tokens (float):
        feature (AiFeature):
        model (str):  Example: claude-sonnet-5-5.
    """

    calls: float
    input_tokens: float
    output_tokens: float
    feature: AiFeature
    model: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        calls = self.calls

        input_tokens = self.input_tokens

        output_tokens = self.output_tokens

        feature = self.feature.value

        model = self.model

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "calls": calls,
                "inputTokens": input_tokens,
                "outputTokens": output_tokens,
                "feature": feature,
                "model": model,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        calls = d.pop("calls")

        input_tokens = d.pop("inputTokens")

        output_tokens = d.pop("outputTokens")

        feature = AiFeature(d.pop("feature"))

        model = d.pop("model")

        ai_usage_line_dto = cls(
            calls=calls,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            feature=feature,
            model=model,
        )

        ai_usage_line_dto.additional_properties = d
        return ai_usage_line_dto

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

from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="AiStatusDto")


@_attrs_define
class AiStatusDto:
    """
    Attributes:
        configured (bool): False until the server has an AI provider key
        provider (str):  Example: anthropic.
        model (str):  Example: claude-sonnet-5-5.
    """

    configured: bool
    provider: str
    model: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        configured = self.configured

        provider = self.provider

        model = self.model

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "configured": configured,
                "provider": provider,
                "model": model,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        configured = d.pop("configured")

        provider = d.pop("provider")

        model = d.pop("model")

        ai_status_dto = cls(
            configured=configured,
            provider=provider,
            model=model,
        )

        ai_status_dto.additional_properties = d
        return ai_status_dto

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

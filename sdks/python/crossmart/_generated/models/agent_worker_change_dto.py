from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="AgentWorkerChangeDto")


@_attrs_define
class AgentWorkerChangeDto:
    """
    Attributes:
        label (str): What changes, for people Example: Price (Medium).
        before (None | str): The value now; null when unknown
        after (None | str): The value after the change
    """

    label: str
    before: None | str
    after: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        label = self.label

        before: None | str
        before = self.before

        after: None | str
        after = self.after

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "label": label,
                "before": before,
                "after": after,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        label = d.pop("label")

        def _parse_before(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        before = _parse_before(d.pop("before"))

        def _parse_after(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        after = _parse_after(d.pop("after"))

        agent_worker_change_dto = cls(
            label=label,
            before=before,
            after=after,
        )

        agent_worker_change_dto.additional_properties = d
        return agent_worker_change_dto

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

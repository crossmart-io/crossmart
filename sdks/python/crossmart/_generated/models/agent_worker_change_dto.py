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
        field (str):  Example: title.
        before (None | str): The value now; null when unknown
        after (None | str): The value after the change
    """

    field: str
    before: None | str
    after: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        field = self.field

        before: None | str
        before = self.before

        after: None | str
        after = self.after

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "field": field,
                "before": before,
                "after": after,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        field = d.pop("field")

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
            field=field,
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

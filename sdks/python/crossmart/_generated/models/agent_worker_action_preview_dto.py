from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.agent_worker_change_dto import AgentWorkerChangeDto


T = TypeVar("T", bound="AgentWorkerActionPreviewDto")


@_attrs_define
class AgentWorkerActionPreviewDto:
    """
    Attributes:
        target (None | str):  Example: Linen Shirt on Outlet store.
        headline (str): The change in one sentence Example: Add 20 units (stock received).
        details (list[str]): More lines to read, such as a note Example: ['Note: Spring delivery'].
        changes (list[AgentWorkerChangeDto]):
    """

    target: None | str
    headline: str
    details: list[str]
    changes: list[AgentWorkerChangeDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        target: None | str
        target = self.target

        headline = self.headline

        details = self.details

        changes = []
        for changes_item_data in self.changes:
            changes_item = changes_item_data.to_dict()
            changes.append(changes_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "target": target,
                "headline": headline,
                "details": details,
                "changes": changes,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.agent_worker_change_dto import AgentWorkerChangeDto

        d = dict(src_dict)

        def _parse_target(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        target = _parse_target(d.pop("target"))

        headline = d.pop("headline")

        details = cast(list[str], d.pop("details"))

        changes = []
        _changes = d.pop("changes")
        for changes_item_data in _changes:
            changes_item = AgentWorkerChangeDto.from_dict(changes_item_data)

            changes.append(changes_item)

        agent_worker_action_preview_dto = cls(
            target=target,
            headline=headline,
            details=details,
            changes=changes,
        )

        agent_worker_action_preview_dto.additional_properties = d
        return agent_worker_action_preview_dto

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

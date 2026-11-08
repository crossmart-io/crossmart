from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.outside_agent_changes import OutsideAgentChanges
from ..types import UNSET, Unset

T = TypeVar("T", bound="UpdateWorkspaceDto")


@_attrs_define
class UpdateWorkspaceDto:
    """
    Attributes:
        name (str | Unset):  Example: EU store.
        time_zone (str | Unset): IANA time zone where the workspace’s day starts, for reports, such as Asia/Jerusalem
            Example: Asia/Jerusalem.
        outside_agent_changes (OutsideAgentChanges | Unset): What happens to changes by outside AI agents (OAuth agents
            and MCP sessions): `require_approval` (the default) makes each one a proposal to approve; `apply_directly` makes
            them at once. API keys over REST always apply directly.
    """

    name: str | Unset = UNSET
    time_zone: str | Unset = UNSET
    outside_agent_changes: OutsideAgentChanges | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        name = self.name

        time_zone = self.time_zone

        outside_agent_changes: str | Unset = UNSET
        if not isinstance(self.outside_agent_changes, Unset):
            outside_agent_changes = self.outside_agent_changes.value

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if name is not UNSET:
            field_dict["name"] = name
        if time_zone is not UNSET:
            field_dict["timeZone"] = time_zone
        if outside_agent_changes is not UNSET:
            field_dict["outsideAgentChanges"] = outside_agent_changes

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        name = d.pop("name", UNSET)

        time_zone = d.pop("timeZone", UNSET)

        _outside_agent_changes = d.pop("outsideAgentChanges", UNSET)
        outside_agent_changes: OutsideAgentChanges | Unset
        if isinstance(_outside_agent_changes, Unset):
            outside_agent_changes = UNSET
        else:
            outside_agent_changes = OutsideAgentChanges(_outside_agent_changes)

        update_workspace_dto = cls(
            name=name,
            time_zone=time_zone,
            outside_agent_changes=outside_agent_changes,
        )

        update_workspace_dto.additional_properties = d
        return update_workspace_dto

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

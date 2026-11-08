from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.activity_actor_type import ActivityActorType

T = TypeVar("T", bound="WorkspaceEventActorDto")


@_attrs_define
class WorkspaceEventActorDto:
    """
    Attributes:
        type_ (ActivityActorType):
        name (None | str): The person or API key; for an agent, the person it acted for
        agent_name (None | str): The agent, for agent actions: "Crossmart Agent", or a connected agent such as "Claude"
            Example: Crossmart Agent.
        approved_by_name (None | str): Who approved the outside agent's proposal that made the change, if anyone
    """

    type_: ActivityActorType
    name: None | str
    agent_name: None | str
    approved_by_name: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        type_ = self.type_.value

        name: None | str
        name = self.name

        agent_name: None | str
        agent_name = self.agent_name

        approved_by_name: None | str
        approved_by_name = self.approved_by_name

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "type": type_,
                "name": name,
                "agentName": agent_name,
                "approvedByName": approved_by_name,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        type_ = ActivityActorType(d.pop("type"))

        def _parse_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        name = _parse_name(d.pop("name"))

        def _parse_agent_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        agent_name = _parse_agent_name(d.pop("agentName"))

        def _parse_approved_by_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        approved_by_name = _parse_approved_by_name(d.pop("approvedByName"))

        workspace_event_actor_dto = cls(
            type_=type_,
            name=name,
            agent_name=agent_name,
            approved_by_name=approved_by_name,
        )

        workspace_event_actor_dto.additional_properties = d
        return workspace_event_actor_dto

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

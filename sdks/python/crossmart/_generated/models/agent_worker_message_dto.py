from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.agent_worker_role import AgentWorkerRole

if TYPE_CHECKING:
    from ..models.agent_worker_action_dto import AgentWorkerActionDto


T = TypeVar("T", bound="AgentWorkerMessageDto")


@_attrs_define
class AgentWorkerMessageDto:
    """
    Attributes:
        id (UUID):
        turn_id (UUID):
        role (AgentWorkerRole):
        text (str): Plain text; the agent may use simple Markdown lists
        actions (list[AgentWorkerActionDto]): Tool calls of this answer
        created_at (datetime.datetime):
    """

    id: UUID
    turn_id: UUID
    role: AgentWorkerRole
    text: str
    actions: list[AgentWorkerActionDto]
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        turn_id = str(self.turn_id)

        role = self.role.value

        text = self.text

        actions = []
        for actions_item_data in self.actions:
            actions_item = actions_item_data.to_dict()
            actions.append(actions_item)

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "turnId": turn_id,
                "role": role,
                "text": text,
                "actions": actions,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.agent_worker_action_dto import AgentWorkerActionDto

        d = dict(src_dict)
        id = UUID(d.pop("id"))

        turn_id = UUID(d.pop("turnId"))

        role = AgentWorkerRole(d.pop("role"))

        text = d.pop("text")

        actions = []
        _actions = d.pop("actions")
        for actions_item_data in _actions:
            actions_item = AgentWorkerActionDto.from_dict(actions_item_data)

            actions.append(actions_item)

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        agent_worker_message_dto = cls(
            id=id,
            turn_id=turn_id,
            role=role,
            text=text,
            actions=actions,
            created_at=created_at,
        )

        agent_worker_message_dto.additional_properties = d
        return agent_worker_message_dto

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

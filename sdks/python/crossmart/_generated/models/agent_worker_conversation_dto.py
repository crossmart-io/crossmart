from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="AgentWorkerConversationDto")


@_attrs_define
class AgentWorkerConversationDto:
    """
    Attributes:
        id (UUID):
        title (str):  Example: Fix my failed eBay listings.
        pending_action_count (float): Changes waiting for approval
        last_activity_at (datetime.datetime):
        created_at (datetime.datetime):
    """

    id: UUID
    title: str
    pending_action_count: float
    last_activity_at: datetime.datetime
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        title = self.title

        pending_action_count = self.pending_action_count

        last_activity_at = self.last_activity_at.isoformat()

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "title": title,
                "pendingActionCount": pending_action_count,
                "lastActivityAt": last_activity_at,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        id = UUID(d.pop("id"))

        title = d.pop("title")

        pending_action_count = d.pop("pendingActionCount")

        last_activity_at = datetime.datetime.fromisoformat(d.pop("lastActivityAt"))

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        agent_worker_conversation_dto = cls(
            id=id,
            title=title,
            pending_action_count=pending_action_count,
            last_activity_at=last_activity_at,
            created_at=created_at,
        )

        agent_worker_conversation_dto.additional_properties = d
        return agent_worker_conversation_dto

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

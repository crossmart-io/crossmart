from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="AttentionProposalDto")


@_attrs_define
class AttentionProposalDto:
    """
    Attributes:
        id (UUID):
        agent_name (str):  Example: Claude.
        tool_name (str):  Example: update_variant_price.
        tool_title (str):  Example: Change a variant’s price.
        summary (str):
        created_at (datetime.datetime):
        expires_at (datetime.datetime):
    """

    id: UUID
    agent_name: str
    tool_name: str
    tool_title: str
    summary: str
    created_at: datetime.datetime
    expires_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        agent_name = self.agent_name

        tool_name = self.tool_name

        tool_title = self.tool_title

        summary = self.summary

        created_at = self.created_at.isoformat()

        expires_at = self.expires_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "agentName": agent_name,
                "toolName": tool_name,
                "toolTitle": tool_title,
                "summary": summary,
                "createdAt": created_at,
                "expiresAt": expires_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        id = UUID(d.pop("id"))

        agent_name = d.pop("agentName")

        tool_name = d.pop("toolName")

        tool_title = d.pop("toolTitle")

        summary = d.pop("summary")

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        expires_at = datetime.datetime.fromisoformat(d.pop("expiresAt"))

        attention_proposal_dto = cls(
            id=id,
            agent_name=agent_name,
            tool_name=tool_name,
            tool_title=tool_title,
            summary=summary,
            created_at=created_at,
            expires_at=expires_at,
        )

        attention_proposal_dto.additional_properties = d
        return attention_proposal_dto

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

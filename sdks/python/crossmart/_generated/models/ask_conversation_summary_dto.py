from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.ask_caller_type import AskCallerType
from ..models.ask_channel import AskChannel
from ..models.ask_outcome import AskOutcome

T = TypeVar("T", bound="AskConversationSummaryDto")


@_attrs_define
class AskConversationSummaryDto:
    """
    Attributes:
        id (UUID):
        channel (AskChannel): Where the question comes from, for Crossmart’s statistics only
        caller_type (AskCallerType):
        client_name (None | str): The agent’s name, for agents
        workspace_id (None | UUID):
        turn_count (float):
        first_question (None | str): The first question, redacted
        last_outcome (AskOutcome | None):
        escalated (bool):
        created_at (datetime.datetime):
        last_activity_at (datetime.datetime):
    """

    id: UUID
    channel: AskChannel
    caller_type: AskCallerType
    client_name: None | str
    workspace_id: None | UUID
    turn_count: float
    first_question: None | str
    last_outcome: AskOutcome | None
    escalated: bool
    created_at: datetime.datetime
    last_activity_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        channel = self.channel.value

        caller_type = self.caller_type.value

        client_name: None | str
        client_name = self.client_name

        workspace_id: None | str
        if isinstance(self.workspace_id, UUID):
            workspace_id = str(self.workspace_id)
        else:
            workspace_id = self.workspace_id

        turn_count = self.turn_count

        first_question: None | str
        first_question = self.first_question

        last_outcome: None | str
        if isinstance(self.last_outcome, AskOutcome):
            last_outcome = self.last_outcome.value
        else:
            last_outcome = self.last_outcome

        escalated = self.escalated

        created_at = self.created_at.isoformat()

        last_activity_at = self.last_activity_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "channel": channel,
                "callerType": caller_type,
                "clientName": client_name,
                "workspaceId": workspace_id,
                "turnCount": turn_count,
                "firstQuestion": first_question,
                "lastOutcome": last_outcome,
                "escalated": escalated,
                "createdAt": created_at,
                "lastActivityAt": last_activity_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        id = UUID(d.pop("id"))

        channel = AskChannel(d.pop("channel"))

        caller_type = AskCallerType(d.pop("callerType"))

        def _parse_client_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        client_name = _parse_client_name(d.pop("clientName"))

        def _parse_workspace_id(data: object) -> None | UUID:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                workspace_id_type_0 = UUID(data)

                return workspace_id_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UUID, data)

        workspace_id = _parse_workspace_id(d.pop("workspaceId"))

        turn_count = d.pop("turnCount")

        def _parse_first_question(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        first_question = _parse_first_question(d.pop("firstQuestion"))

        def _parse_last_outcome(data: object) -> AskOutcome | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                last_outcome_type_0 = AskOutcome(data)

                return last_outcome_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(AskOutcome | None, data)

        last_outcome = _parse_last_outcome(d.pop("lastOutcome"))

        escalated = d.pop("escalated")

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        last_activity_at = datetime.datetime.fromisoformat(d.pop("lastActivityAt"))

        ask_conversation_summary_dto = cls(
            id=id,
            channel=channel,
            caller_type=caller_type,
            client_name=client_name,
            workspace_id=workspace_id,
            turn_count=turn_count,
            first_question=first_question,
            last_outcome=last_outcome,
            escalated=escalated,
            created_at=created_at,
            last_activity_at=last_activity_at,
        )

        ask_conversation_summary_dto.additional_properties = d
        return ask_conversation_summary_dto

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

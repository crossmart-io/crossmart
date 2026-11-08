from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.agent_worker_conversation_dto import AgentWorkerConversationDto
    from ..models.agent_worker_message_dto import AgentWorkerMessageDto
    from ..models.agent_worker_turn_dto import AgentWorkerTurnDto


T = TypeVar("T", bound="AgentWorkerConversationDetailDto")


@_attrs_define
class AgentWorkerConversationDetailDto:
    """
    Attributes:
        conversation (AgentWorkerConversationDto):
        messages (list[AgentWorkerMessageDto]): Oldest first
        active_turn (AgentWorkerTurnDto | None): The turn running or waiting for approval; null when the agent is idle
    """

    conversation: AgentWorkerConversationDto
    messages: list[AgentWorkerMessageDto]
    active_turn: AgentWorkerTurnDto | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.agent_worker_turn_dto import AgentWorkerTurnDto

        conversation = self.conversation.to_dict()

        messages = []
        for messages_item_data in self.messages:
            messages_item = messages_item_data.to_dict()
            messages.append(messages_item)

        active_turn: dict[str, Any] | None
        if isinstance(self.active_turn, AgentWorkerTurnDto):
            active_turn = self.active_turn.to_dict()
        else:
            active_turn = self.active_turn

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "conversation": conversation,
                "messages": messages,
                "activeTurn": active_turn,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.agent_worker_conversation_dto import AgentWorkerConversationDto
        from ..models.agent_worker_message_dto import AgentWorkerMessageDto
        from ..models.agent_worker_turn_dto import AgentWorkerTurnDto

        d = dict(src_dict)
        conversation = AgentWorkerConversationDto.from_dict(d.pop("conversation"))

        messages = []
        _messages = d.pop("messages")
        for messages_item_data in _messages:
            messages_item = AgentWorkerMessageDto.from_dict(messages_item_data)

            messages.append(messages_item)

        def _parse_active_turn(data: object) -> AgentWorkerTurnDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                active_turn_type_0 = AgentWorkerTurnDto.from_dict(data)

                return active_turn_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(AgentWorkerTurnDto | None, data)

        active_turn = _parse_active_turn(d.pop("activeTurn"))

        agent_worker_conversation_detail_dto = cls(
            conversation=conversation,
            messages=messages,
            active_turn=active_turn,
        )

        agent_worker_conversation_detail_dto.additional_properties = d
        return agent_worker_conversation_detail_dto

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

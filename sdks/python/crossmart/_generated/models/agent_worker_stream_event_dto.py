from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.agent_worker_event_type import AgentWorkerEventType
from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.agent_worker_action_dto import AgentWorkerActionDto
    from ..models.agent_worker_error_dto import AgentWorkerErrorDto
    from ..models.agent_worker_message_dto import AgentWorkerMessageDto
    from ..models.agent_worker_turn_dto import AgentWorkerTurnDto


T = TypeVar("T", bound="AgentWorkerStreamEventDto")


@_attrs_define
class AgentWorkerStreamEventDto:
    """
    Attributes:
        type_ (AgentWorkerEventType):
        turn (AgentWorkerTurnDto | Unset):
        delta (str | Unset): text_delta: the next piece of the answer
        message (AgentWorkerMessageDto | Unset):
        action (AgentWorkerActionDto | Unset):
        error (AgentWorkerErrorDto | Unset):
    """

    type_: AgentWorkerEventType
    turn: AgentWorkerTurnDto | Unset = UNSET
    delta: str | Unset = UNSET
    message: AgentWorkerMessageDto | Unset = UNSET
    action: AgentWorkerActionDto | Unset = UNSET
    error: AgentWorkerErrorDto | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        type_ = self.type_.value

        turn: dict[str, Any] | Unset = UNSET
        if not isinstance(self.turn, Unset):
            turn = self.turn.to_dict()

        delta = self.delta

        message: dict[str, Any] | Unset = UNSET
        if not isinstance(self.message, Unset):
            message = self.message.to_dict()

        action: dict[str, Any] | Unset = UNSET
        if not isinstance(self.action, Unset):
            action = self.action.to_dict()

        error: dict[str, Any] | Unset = UNSET
        if not isinstance(self.error, Unset):
            error = self.error.to_dict()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "type": type_,
            }
        )
        if turn is not UNSET:
            field_dict["turn"] = turn
        if delta is not UNSET:
            field_dict["delta"] = delta
        if message is not UNSET:
            field_dict["message"] = message
        if action is not UNSET:
            field_dict["action"] = action
        if error is not UNSET:
            field_dict["error"] = error

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.agent_worker_action_dto import AgentWorkerActionDto
        from ..models.agent_worker_error_dto import AgentWorkerErrorDto
        from ..models.agent_worker_message_dto import AgentWorkerMessageDto
        from ..models.agent_worker_turn_dto import AgentWorkerTurnDto

        d = dict(src_dict)
        type_ = AgentWorkerEventType(d.pop("type"))

        _turn = d.pop("turn", UNSET)
        turn: AgentWorkerTurnDto | Unset
        if isinstance(_turn, Unset):
            turn = UNSET
        else:
            turn = AgentWorkerTurnDto.from_dict(_turn)

        delta = d.pop("delta", UNSET)

        _message = d.pop("message", UNSET)
        message: AgentWorkerMessageDto | Unset
        if isinstance(_message, Unset):
            message = UNSET
        else:
            message = AgentWorkerMessageDto.from_dict(_message)

        _action = d.pop("action", UNSET)
        action: AgentWorkerActionDto | Unset
        if isinstance(_action, Unset):
            action = UNSET
        else:
            action = AgentWorkerActionDto.from_dict(_action)

        _error = d.pop("error", UNSET)
        error: AgentWorkerErrorDto | Unset
        if isinstance(_error, Unset):
            error = UNSET
        else:
            error = AgentWorkerErrorDto.from_dict(_error)

        agent_worker_stream_event_dto = cls(
            type_=type_,
            turn=turn,
            delta=delta,
            message=message,
            action=action,
            error=error,
        )

        agent_worker_stream_event_dto.additional_properties = d
        return agent_worker_stream_event_dto

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

from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.agent_worker_turn_status import AgentWorkerTurnStatus
from ..models.agent_worker_turn_trigger import AgentWorkerTurnTrigger

T = TypeVar("T", bound="AgentWorkerTurnDto")


@_attrs_define
class AgentWorkerTurnDto:
    """
    Attributes:
        id (UUID):
        trigger (AgentWorkerTurnTrigger):
        status (AgentWorkerTurnStatus):
        model_calls (float): Model calls so far; each uses one AI credit
        input_tokens (float):
        output_tokens (float):
        failure_reason (None | str): Why it failed or stopped early
        started_at (datetime.datetime):
        finished_at (datetime.datetime | None):
    """

    id: UUID
    trigger: AgentWorkerTurnTrigger
    status: AgentWorkerTurnStatus
    model_calls: float
    input_tokens: float
    output_tokens: float
    failure_reason: None | str
    started_at: datetime.datetime
    finished_at: datetime.datetime | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        trigger = self.trigger.value

        status = self.status.value

        model_calls = self.model_calls

        input_tokens = self.input_tokens

        output_tokens = self.output_tokens

        failure_reason: None | str
        failure_reason = self.failure_reason

        started_at = self.started_at.isoformat()

        finished_at: None | str
        if isinstance(self.finished_at, datetime.datetime):
            finished_at = self.finished_at.isoformat()
        else:
            finished_at = self.finished_at

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "trigger": trigger,
                "status": status,
                "modelCalls": model_calls,
                "inputTokens": input_tokens,
                "outputTokens": output_tokens,
                "failureReason": failure_reason,
                "startedAt": started_at,
                "finishedAt": finished_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        id = UUID(d.pop("id"))

        trigger = AgentWorkerTurnTrigger(d.pop("trigger"))

        status = AgentWorkerTurnStatus(d.pop("status"))

        model_calls = d.pop("modelCalls")

        input_tokens = d.pop("inputTokens")

        output_tokens = d.pop("outputTokens")

        def _parse_failure_reason(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        failure_reason = _parse_failure_reason(d.pop("failureReason"))

        started_at = datetime.datetime.fromisoformat(d.pop("startedAt"))

        def _parse_finished_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                finished_at_type_0 = datetime.datetime.fromisoformat(data)

                return finished_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        finished_at = _parse_finished_at(d.pop("finishedAt"))

        agent_worker_turn_dto = cls(
            id=id,
            trigger=trigger,
            status=status,
            model_calls=model_calls,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            failure_reason=failure_reason,
            started_at=started_at,
            finished_at=finished_at,
        )

        agent_worker_turn_dto.additional_properties = d
        return agent_worker_turn_dto

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

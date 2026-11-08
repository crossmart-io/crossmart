from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.agent_worker_action_risk import AgentWorkerActionRisk
from ..models.agent_worker_action_status import AgentWorkerActionStatus
from ..models.agent_worker_tool_kind import AgentWorkerToolKind

if TYPE_CHECKING:
    from ..models.agent_worker_action_preview_dto import AgentWorkerActionPreviewDto


T = TypeVar("T", bound="AgentWorkerActionDto")


@_attrs_define
class AgentWorkerActionDto:
    """
    Attributes:
        id (UUID):
        message_id (UUID):
        tool_name (str): The MCP tool it calls Example: retry_store_listing.
        tool_title (str):  Example: Retry publishing a product to a store.
        kind (AgentWorkerToolKind):
        status (AgentWorkerActionStatus):
        summary (str):  Example: Override or revert fields of a listing: Linen Shirt on Outlet store.
        risks (list[AgentWorkerActionRisk]): Why approving it also needs `confirmHighRisk`; empty for ordinary changes
        preview (AgentWorkerActionPreviewDto | None):
        outcome (None | str):  Example: 12 found.
        is_error (bool):
        untrusted_warning (bool): Text read in the same turn looked like instructions to an AI: review with care
        decided_at (datetime.datetime | None):
        executed_at (datetime.datetime | None):
        created_at (datetime.datetime):
    """

    id: UUID
    message_id: UUID
    tool_name: str
    tool_title: str
    kind: AgentWorkerToolKind
    status: AgentWorkerActionStatus
    summary: str
    risks: list[AgentWorkerActionRisk]
    preview: AgentWorkerActionPreviewDto | None
    outcome: None | str
    is_error: bool
    untrusted_warning: bool
    decided_at: datetime.datetime | None
    executed_at: datetime.datetime | None
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.agent_worker_action_preview_dto import AgentWorkerActionPreviewDto

        id = str(self.id)

        message_id = str(self.message_id)

        tool_name = self.tool_name

        tool_title = self.tool_title

        kind = self.kind.value

        status = self.status.value

        summary = self.summary

        risks = []
        for risks_item_data in self.risks:
            risks_item = risks_item_data.value
            risks.append(risks_item)

        preview: dict[str, Any] | None
        if isinstance(self.preview, AgentWorkerActionPreviewDto):
            preview = self.preview.to_dict()
        else:
            preview = self.preview

        outcome: None | str
        outcome = self.outcome

        is_error = self.is_error

        untrusted_warning = self.untrusted_warning

        decided_at: None | str
        if isinstance(self.decided_at, datetime.datetime):
            decided_at = self.decided_at.isoformat()
        else:
            decided_at = self.decided_at

        executed_at: None | str
        if isinstance(self.executed_at, datetime.datetime):
            executed_at = self.executed_at.isoformat()
        else:
            executed_at = self.executed_at

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "messageId": message_id,
                "toolName": tool_name,
                "toolTitle": tool_title,
                "kind": kind,
                "status": status,
                "summary": summary,
                "risks": risks,
                "preview": preview,
                "outcome": outcome,
                "isError": is_error,
                "untrustedWarning": untrusted_warning,
                "decidedAt": decided_at,
                "executedAt": executed_at,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.agent_worker_action_preview_dto import AgentWorkerActionPreviewDto

        d = dict(src_dict)
        id = UUID(d.pop("id"))

        message_id = UUID(d.pop("messageId"))

        tool_name = d.pop("toolName")

        tool_title = d.pop("toolTitle")

        kind = AgentWorkerToolKind(d.pop("kind"))

        status = AgentWorkerActionStatus(d.pop("status"))

        summary = d.pop("summary")

        risks = []
        _risks = d.pop("risks")
        for risks_item_data in _risks:
            risks_item = AgentWorkerActionRisk(risks_item_data)

            risks.append(risks_item)

        def _parse_preview(data: object) -> AgentWorkerActionPreviewDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                preview_type_0 = AgentWorkerActionPreviewDto.from_dict(data)

                return preview_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(AgentWorkerActionPreviewDto | None, data)

        preview = _parse_preview(d.pop("preview"))

        def _parse_outcome(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        outcome = _parse_outcome(d.pop("outcome"))

        is_error = d.pop("isError")

        untrusted_warning = d.pop("untrustedWarning")

        def _parse_decided_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                decided_at_type_0 = datetime.datetime.fromisoformat(data)

                return decided_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        decided_at = _parse_decided_at(d.pop("decidedAt"))

        def _parse_executed_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                executed_at_type_0 = datetime.datetime.fromisoformat(data)

                return executed_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        executed_at = _parse_executed_at(d.pop("executedAt"))

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        agent_worker_action_dto = cls(
            id=id,
            message_id=message_id,
            tool_name=tool_name,
            tool_title=tool_title,
            kind=kind,
            status=status,
            summary=summary,
            risks=risks,
            preview=preview,
            outcome=outcome,
            is_error=is_error,
            untrusted_warning=untrusted_warning,
            decided_at=decided_at,
            executed_at=executed_at,
            created_at=created_at,
        )

        agent_worker_action_dto.additional_properties = d
        return agent_worker_action_dto

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

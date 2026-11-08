from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.agent_proposal_status import AgentProposalStatus
from ..models.agent_proposer_kind import AgentProposerKind
from ..models.agent_worker_action_risk import AgentWorkerActionRisk

if TYPE_CHECKING:
    from ..models.agent_worker_action_preview_dto import AgentWorkerActionPreviewDto
    from ..models.agent_worker_action_targets_dto import AgentWorkerActionTargetsDto


T = TypeVar("T", bound="AgentProposalDto")


@_attrs_define
class AgentProposalDto:
    """
    Attributes:
        id (UUID):
        tool_name (str): The MCP tool it calls Example: update_variant_price.
        tool_title (str):  Example: Change a variant's price.
        status (AgentProposalStatus): A pending proposal past its expiry reads as expired
        proposer_kind (AgentProposerKind):
        agent_name (str): The agent; for an MCP session with a key, the key's name Example: Claude.
        on_behalf_of_name (None | str): The person the agent acts for
        summary (str):  Example: Change a variant's price: Linen Shirt.
        risks (list[AgentWorkerActionRisk]): Why approving it also needs `confirmHighRisk`; empty for ordinary changes
        preview (AgentWorkerActionPreviewDto | None):
        targets (AgentWorkerActionTargetsDto):
        result (None | str): The API's answer once applied, or why it was refused
        is_error (bool): True when the approved change was refused
        decided_by_name (None | str):
        decided_at (datetime.datetime | None):
        finished_at (datetime.datetime | None):
        expires_at (datetime.datetime): When it expires if nobody decides
        created_at (datetime.datetime):
    """

    id: UUID
    tool_name: str
    tool_title: str
    status: AgentProposalStatus
    proposer_kind: AgentProposerKind
    agent_name: str
    on_behalf_of_name: None | str
    summary: str
    risks: list[AgentWorkerActionRisk]
    preview: AgentWorkerActionPreviewDto | None
    targets: AgentWorkerActionTargetsDto
    result: None | str
    is_error: bool
    decided_by_name: None | str
    decided_at: datetime.datetime | None
    finished_at: datetime.datetime | None
    expires_at: datetime.datetime
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.agent_worker_action_preview_dto import AgentWorkerActionPreviewDto

        id = str(self.id)

        tool_name = self.tool_name

        tool_title = self.tool_title

        status = self.status.value

        proposer_kind = self.proposer_kind.value

        agent_name = self.agent_name

        on_behalf_of_name: None | str
        on_behalf_of_name = self.on_behalf_of_name

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

        targets = self.targets.to_dict()

        result: None | str
        result = self.result

        is_error = self.is_error

        decided_by_name: None | str
        decided_by_name = self.decided_by_name

        decided_at: None | str
        if isinstance(self.decided_at, datetime.datetime):
            decided_at = self.decided_at.isoformat()
        else:
            decided_at = self.decided_at

        finished_at: None | str
        if isinstance(self.finished_at, datetime.datetime):
            finished_at = self.finished_at.isoformat()
        else:
            finished_at = self.finished_at

        expires_at = self.expires_at.isoformat()

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "toolName": tool_name,
                "toolTitle": tool_title,
                "status": status,
                "proposerKind": proposer_kind,
                "agentName": agent_name,
                "onBehalfOfName": on_behalf_of_name,
                "summary": summary,
                "risks": risks,
                "preview": preview,
                "targets": targets,
                "result": result,
                "isError": is_error,
                "decidedByName": decided_by_name,
                "decidedAt": decided_at,
                "finishedAt": finished_at,
                "expiresAt": expires_at,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.agent_worker_action_preview_dto import AgentWorkerActionPreviewDto
        from ..models.agent_worker_action_targets_dto import AgentWorkerActionTargetsDto

        d = dict(src_dict)
        id = UUID(d.pop("id"))

        tool_name = d.pop("toolName")

        tool_title = d.pop("toolTitle")

        status = AgentProposalStatus(d.pop("status"))

        proposer_kind = AgentProposerKind(d.pop("proposerKind"))

        agent_name = d.pop("agentName")

        def _parse_on_behalf_of_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        on_behalf_of_name = _parse_on_behalf_of_name(d.pop("onBehalfOfName"))

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

        targets = AgentWorkerActionTargetsDto.from_dict(d.pop("targets"))

        def _parse_result(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        result = _parse_result(d.pop("result"))

        is_error = d.pop("isError")

        def _parse_decided_by_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        decided_by_name = _parse_decided_by_name(d.pop("decidedByName"))

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

        expires_at = datetime.datetime.fromisoformat(d.pop("expiresAt"))

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        agent_proposal_dto = cls(
            id=id,
            tool_name=tool_name,
            tool_title=tool_title,
            status=status,
            proposer_kind=proposer_kind,
            agent_name=agent_name,
            on_behalf_of_name=on_behalf_of_name,
            summary=summary,
            risks=risks,
            preview=preview,
            targets=targets,
            result=result,
            is_error=is_error,
            decided_by_name=decided_by_name,
            decided_at=decided_at,
            finished_at=finished_at,
            expires_at=expires_at,
            created_at=created_at,
        )

        agent_proposal_dto.additional_properties = d
        return agent_proposal_dto

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

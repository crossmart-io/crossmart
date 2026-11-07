from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.account_lookup_kind import AccountLookupKind
from ..models.ask_confidence import AskConfidence
from ..models.ask_escalation_reason import AskEscalationReason
from ..models.ask_outcome import AskOutcome

if TYPE_CHECKING:
    from ..models.ask_citation_dto import AskCitationDto


T = TypeVar("T", bound="AskTurnDto")


@_attrs_define
class AskTurnDto:
    """
    Attributes:
        id (UUID):
        position (float):
        question (str): The question, with obvious secrets and emails redacted
        answer (str):
        outcome (AskOutcome): `answered` from the cited pages; `unknown` when the docs do not answer it (the answer
            points to support); `out_of_scope` when it is not about Crossmart
        confidence (AskConfidence):
        citations (list[AskCitationDto]):
        account_lookups (list[AccountLookupKind]):
        escalation_reason (AskEscalationReason | None):
        latency_ms (float):
        model (None | str):
        cached (bool):
        created_at (datetime.datetime):
    """

    id: UUID
    position: float
    question: str
    answer: str
    outcome: AskOutcome
    confidence: AskConfidence
    citations: list[AskCitationDto]
    account_lookups: list[AccountLookupKind]
    escalation_reason: AskEscalationReason | None
    latency_ms: float
    model: None | str
    cached: bool
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        position = self.position

        question = self.question

        answer = self.answer

        outcome = self.outcome.value

        confidence = self.confidence.value

        citations = []
        for citations_item_data in self.citations:
            citations_item = citations_item_data.to_dict()
            citations.append(citations_item)

        account_lookups = []
        for account_lookups_item_data in self.account_lookups:
            account_lookups_item = account_lookups_item_data.value
            account_lookups.append(account_lookups_item)

        escalation_reason: None | str
        if isinstance(self.escalation_reason, AskEscalationReason):
            escalation_reason = self.escalation_reason.value
        else:
            escalation_reason = self.escalation_reason

        latency_ms = self.latency_ms

        model: None | str
        model = self.model

        cached = self.cached

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "position": position,
                "question": question,
                "answer": answer,
                "outcome": outcome,
                "confidence": confidence,
                "citations": citations,
                "accountLookups": account_lookups,
                "escalationReason": escalation_reason,
                "latencyMs": latency_ms,
                "model": model,
                "cached": cached,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.ask_citation_dto import AskCitationDto

        d = dict(src_dict)
        id = UUID(d.pop("id"))

        position = d.pop("position")

        question = d.pop("question")

        answer = d.pop("answer")

        outcome = AskOutcome(d.pop("outcome"))

        confidence = AskConfidence(d.pop("confidence"))

        citations = []
        _citations = d.pop("citations")
        for citations_item_data in _citations:
            citations_item = AskCitationDto.from_dict(citations_item_data)

            citations.append(citations_item)

        account_lookups = []
        _account_lookups = d.pop("accountLookups")
        for account_lookups_item_data in _account_lookups:
            account_lookups_item = AccountLookupKind(account_lookups_item_data)

            account_lookups.append(account_lookups_item)

        def _parse_escalation_reason(data: object) -> AskEscalationReason | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                escalation_reason_type_0 = AskEscalationReason(data)

                return escalation_reason_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(AskEscalationReason | None, data)

        escalation_reason = _parse_escalation_reason(d.pop("escalationReason"))

        latency_ms = d.pop("latencyMs")

        def _parse_model(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        model = _parse_model(d.pop("model"))

        cached = d.pop("cached")

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        ask_turn_dto = cls(
            id=id,
            position=position,
            question=question,
            answer=answer,
            outcome=outcome,
            confidence=confidence,
            citations=citations,
            account_lookups=account_lookups,
            escalation_reason=escalation_reason,
            latency_ms=latency_ms,
            model=model,
            cached=cached,
            created_at=created_at,
        )

        ask_turn_dto.additional_properties = d
        return ask_turn_dto

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

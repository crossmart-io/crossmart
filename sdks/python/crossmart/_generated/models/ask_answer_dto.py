from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.ask_confidence import AskConfidence
from ..models.ask_outcome import AskOutcome

if TYPE_CHECKING:
    from ..models.ask_citation_dto import AskCitationDto


T = TypeVar("T", bound="AskAnswerDto")


@_attrs_define
class AskAnswerDto:
    """
    Attributes:
        outcome (AskOutcome): `answered` from the cited pages; `unknown` when the docs do not answer it (the answer
            points to support); `out_of_scope` when it is not about Crossmart
        answer (str): The answer, in plain text (no Markdown)
        citations (list[AskCitationDto]): Pages the answer is based on
        confidence (AskConfidence):
        handoff (bool): True when a person should take over, at supportEmail
        support_email (str):
    """

    outcome: AskOutcome
    answer: str
    citations: list[AskCitationDto]
    confidence: AskConfidence
    handoff: bool
    support_email: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        outcome = self.outcome.value

        answer = self.answer

        citations = []
        for citations_item_data in self.citations:
            citations_item = citations_item_data.to_dict()
            citations.append(citations_item)

        confidence = self.confidence.value

        handoff = self.handoff

        support_email = self.support_email

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "outcome": outcome,
                "answer": answer,
                "citations": citations,
                "confidence": confidence,
                "handoff": handoff,
                "supportEmail": support_email,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.ask_citation_dto import AskCitationDto

        d = dict(src_dict)
        outcome = AskOutcome(d.pop("outcome"))

        answer = d.pop("answer")

        citations = []
        _citations = d.pop("citations")
        for citations_item_data in _citations:
            citations_item = AskCitationDto.from_dict(citations_item_data)

            citations.append(citations_item)

        confidence = AskConfidence(d.pop("confidence"))

        handoff = d.pop("handoff")

        support_email = d.pop("supportEmail")

        ask_answer_dto = cls(
            outcome=outcome,
            answer=answer,
            citations=citations,
            confidence=confidence,
            handoff=handoff,
            support_email=support_email,
        )

        ask_answer_dto.additional_properties = d
        return ask_answer_dto

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

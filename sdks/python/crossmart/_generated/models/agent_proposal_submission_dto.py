from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.agent_proposal_outcome import AgentProposalOutcome

if TYPE_CHECKING:
    from ..models.agent_proposal_dto import AgentProposalDto


T = TypeVar("T", bound="AgentProposalSubmissionDto")


@_attrs_define
class AgentProposalSubmissionDto:
    """
    Attributes:
        outcome (AgentProposalOutcome): `proposed`: it waits for the seller. `apply_directly`: the workspace lets agents
            make changes at once, so make the call itself.
        message (str): What to do next, or to tell the user
        proposal (AgentProposalDto | None):
    """

    outcome: AgentProposalOutcome
    message: str
    proposal: AgentProposalDto | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.agent_proposal_dto import AgentProposalDto

        outcome = self.outcome.value

        message = self.message

        proposal: dict[str, Any] | None
        if isinstance(self.proposal, AgentProposalDto):
            proposal = self.proposal.to_dict()
        else:
            proposal = self.proposal

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "outcome": outcome,
                "message": message,
                "proposal": proposal,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.agent_proposal_dto import AgentProposalDto

        d = dict(src_dict)
        outcome = AgentProposalOutcome(d.pop("outcome"))

        message = d.pop("message")

        def _parse_proposal(data: object) -> AgentProposalDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                proposal_type_0 = AgentProposalDto.from_dict(data)

                return proposal_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(AgentProposalDto | None, data)

        proposal = _parse_proposal(d.pop("proposal"))

        agent_proposal_submission_dto = cls(
            outcome=outcome,
            message=message,
            proposal=proposal,
        )

        agent_proposal_submission_dto.additional_properties = d
        return agent_proposal_submission_dto

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

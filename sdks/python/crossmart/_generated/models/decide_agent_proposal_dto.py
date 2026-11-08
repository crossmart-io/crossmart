from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

T = TypeVar("T", bound="DecideAgentProposalDto")


@_attrs_define
class DecideAgentProposalDto:
    """
    Attributes:
        confirm_high_risk (bool | Unset): Required for a proposal with risks (deletes, changes prices, or many items)
            Default: False.
    """

    confirm_high_risk: bool | Unset = False
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        confirm_high_risk = self.confirm_high_risk

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if confirm_high_risk is not UNSET:
            field_dict["confirmHighRisk"] = confirm_high_risk

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        confirm_high_risk = d.pop("confirmHighRisk", UNSET)

        decide_agent_proposal_dto = cls(
            confirm_high_risk=confirm_high_risk,
        )

        decide_agent_proposal_dto.additional_properties = d
        return decide_agent_proposal_dto

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

from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

T = TypeVar("T", bound="DecideAgentWorkerActionsDto")


@_attrs_define
class DecideAgentWorkerActionsDto:
    """
    Attributes:
        approved_action_ids (list[UUID]): The waiting actions to approve; every other waiting action of the conversation
            is rejected. Empty rejects them all.
        confirm_high_risk (bool | Unset): Required (true) to approve an action with `risks`: a deletion, a price change
            or a bulk change Default: False.
    """

    approved_action_ids: list[UUID]
    confirm_high_risk: bool | Unset = False
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        approved_action_ids = []
        for approved_action_ids_item_data in self.approved_action_ids:
            approved_action_ids_item = str(approved_action_ids_item_data)
            approved_action_ids.append(approved_action_ids_item)

        confirm_high_risk = self.confirm_high_risk

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "approvedActionIds": approved_action_ids,
            }
        )
        if confirm_high_risk is not UNSET:
            field_dict["confirmHighRisk"] = confirm_high_risk

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        approved_action_ids = []
        _approved_action_ids = d.pop("approvedActionIds")
        for approved_action_ids_item_data in _approved_action_ids:
            approved_action_ids_item = UUID(approved_action_ids_item_data)

            approved_action_ids.append(approved_action_ids_item)

        confirm_high_risk = d.pop("confirmHighRisk", UNSET)

        decide_agent_worker_actions_dto = cls(
            approved_action_ids=approved_action_ids,
            confirm_high_risk=confirm_high_risk,
        )

        decide_agent_worker_actions_dto.additional_properties = d
        return decide_agent_worker_actions_dto

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

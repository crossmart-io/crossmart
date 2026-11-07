from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.ask_escalation_reason import AskEscalationReason

T = TypeVar("T", bound="AskEscalationOfferDto")


@_attrs_define
class AskEscalationOfferDto:
    """
    Attributes:
        offered (bool): True when a person can follow up: call `POST /api/v1/ask/escalations` with the `conversationId`
            to reach one
        reason (AskEscalationReason | None): Why a person is offered; null when none is
    """

    offered: bool
    reason: AskEscalationReason | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        offered = self.offered

        reason: None | str
        if isinstance(self.reason, AskEscalationReason):
            reason = self.reason.value
        else:
            reason = self.reason

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "offered": offered,
                "reason": reason,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        offered = d.pop("offered")

        def _parse_reason(data: object) -> AskEscalationReason | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                reason_type_0 = AskEscalationReason(data)

                return reason_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(AskEscalationReason | None, data)

        reason = _parse_reason(d.pop("reason"))

        ask_escalation_offer_dto = cls(
            offered=offered,
            reason=reason,
        )

        ask_escalation_offer_dto.additional_properties = d
        return ask_escalation_offer_dto

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

from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.ask_escalation_reason import AskEscalationReason
from ..models.ask_escalation_status import AskEscalationStatus

T = TypeVar("T", bound="AskEscalationDto")


@_attrs_define
class AskEscalationDto:
    """
    Attributes:
        id (str): The ticket id. It is the only way to read the escalation, so keep it like a password.
        status (AskEscalationStatus):
        reason (AskEscalationReason): Why a person is offered; null when none is
        reply (None | str): The team’s reply, once sent
        replied_at (datetime.datetime | None):
        created_at (datetime.datetime):
    """

    id: str
    status: AskEscalationStatus
    reason: AskEscalationReason
    reply: None | str
    replied_at: datetime.datetime | None
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = self.id

        status = self.status.value

        reason = self.reason.value

        reply: None | str
        reply = self.reply

        replied_at: None | str
        if isinstance(self.replied_at, datetime.datetime):
            replied_at = self.replied_at.isoformat()
        else:
            replied_at = self.replied_at

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "status": status,
                "reason": reason,
                "reply": reply,
                "repliedAt": replied_at,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        id = d.pop("id")

        status = AskEscalationStatus(d.pop("status"))

        reason = AskEscalationReason(d.pop("reason"))

        def _parse_reply(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        reply = _parse_reply(d.pop("reply"))

        def _parse_replied_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                replied_at_type_0 = datetime.datetime.fromisoformat(data)

                return replied_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        replied_at = _parse_replied_at(d.pop("repliedAt"))

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        ask_escalation_dto = cls(
            id=id,
            status=status,
            reason=reason,
            reply=reply,
            replied_at=replied_at,
            created_at=created_at,
        )

        ask_escalation_dto.additional_properties = d
        return ask_escalation_dto

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

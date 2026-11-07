from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.ask_escalation_reason import AskEscalationReason
from ..models.ask_escalation_status import AskEscalationStatus

T = TypeVar("T", bound="AskEscalationRecordDto")


@_attrs_define
class AskEscalationRecordDto:
    """
    Attributes:
        id (UUID):
        conversation_id (UUID):
        reason (AskEscalationReason): Why a person is offered; null when none is
        status (AskEscalationStatus):
        contact_email (None | str):
        callback_url (None | str):
        reply (None | str):
        replied_at (datetime.datetime | None):
        replied_by (None | str): The admin who replied
        callback_delivered_at (datetime.datetime | None):
        callback_error (None | str): Why the callback failed
        created_at (datetime.datetime):
    """

    id: UUID
    conversation_id: UUID
    reason: AskEscalationReason
    status: AskEscalationStatus
    contact_email: None | str
    callback_url: None | str
    reply: None | str
    replied_at: datetime.datetime | None
    replied_by: None | str
    callback_delivered_at: datetime.datetime | None
    callback_error: None | str
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        conversation_id = str(self.conversation_id)

        reason = self.reason.value

        status = self.status.value

        contact_email: None | str
        contact_email = self.contact_email

        callback_url: None | str
        callback_url = self.callback_url

        reply: None | str
        reply = self.reply

        replied_at: None | str
        if isinstance(self.replied_at, datetime.datetime):
            replied_at = self.replied_at.isoformat()
        else:
            replied_at = self.replied_at

        replied_by: None | str
        replied_by = self.replied_by

        callback_delivered_at: None | str
        if isinstance(self.callback_delivered_at, datetime.datetime):
            callback_delivered_at = self.callback_delivered_at.isoformat()
        else:
            callback_delivered_at = self.callback_delivered_at

        callback_error: None | str
        callback_error = self.callback_error

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "conversationId": conversation_id,
                "reason": reason,
                "status": status,
                "contactEmail": contact_email,
                "callbackUrl": callback_url,
                "reply": reply,
                "repliedAt": replied_at,
                "repliedBy": replied_by,
                "callbackDeliveredAt": callback_delivered_at,
                "callbackError": callback_error,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        id = UUID(d.pop("id"))

        conversation_id = UUID(d.pop("conversationId"))

        reason = AskEscalationReason(d.pop("reason"))

        status = AskEscalationStatus(d.pop("status"))

        def _parse_contact_email(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        contact_email = _parse_contact_email(d.pop("contactEmail"))

        def _parse_callback_url(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        callback_url = _parse_callback_url(d.pop("callbackUrl"))

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

        def _parse_replied_by(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        replied_by = _parse_replied_by(d.pop("repliedBy"))

        def _parse_callback_delivered_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                callback_delivered_at_type_0 = datetime.datetime.fromisoformat(data)

                return callback_delivered_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        callback_delivered_at = _parse_callback_delivered_at(
            d.pop("callbackDeliveredAt")
        )

        def _parse_callback_error(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        callback_error = _parse_callback_error(d.pop("callbackError"))

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        ask_escalation_record_dto = cls(
            id=id,
            conversation_id=conversation_id,
            reason=reason,
            status=status,
            contact_email=contact_email,
            callback_url=callback_url,
            reply=reply,
            replied_at=replied_at,
            replied_by=replied_by,
            callback_delivered_at=callback_delivered_at,
            callback_error=callback_error,
            created_at=created_at,
        )

        ask_escalation_record_dto.additional_properties = d
        return ask_escalation_record_dto

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

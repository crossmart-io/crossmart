from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.ask_escalation_reason import AskEscalationReason
from ..types import UNSET, Unset

T = TypeVar("T", bound="CreateAskEscalationDto")


@_attrs_define
class CreateAskEscalationDto:
    """
    Attributes:
        conversation_id (str): The `conversationId` of your conversation with Ask Crossmart
        contact_email (str | Unset): Where a person from the Crossmart team should email the reply
        callback_url (str | Unset): A public https URL the reply is POSTed to, signed like Crossmart webhooks with the
            `callbackSecret` this call returns (event type `ask.escalation.replied`)
        reason (AskEscalationReason | Unset): Why a person is offered; null when none is
    """

    conversation_id: str
    contact_email: str | Unset = UNSET
    callback_url: str | Unset = UNSET
    reason: AskEscalationReason | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        conversation_id = self.conversation_id

        contact_email = self.contact_email

        callback_url = self.callback_url

        reason: str | Unset = UNSET
        if not isinstance(self.reason, Unset):
            reason = self.reason.value

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "conversationId": conversation_id,
            }
        )
        if contact_email is not UNSET:
            field_dict["contactEmail"] = contact_email
        if callback_url is not UNSET:
            field_dict["callbackUrl"] = callback_url
        if reason is not UNSET:
            field_dict["reason"] = reason

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        conversation_id = d.pop("conversationId")

        contact_email = d.pop("contactEmail", UNSET)

        callback_url = d.pop("callbackUrl", UNSET)

        _reason = d.pop("reason", UNSET)
        reason: AskEscalationReason | Unset
        if isinstance(_reason, Unset):
            reason = UNSET
        else:
            reason = AskEscalationReason(_reason)

        create_ask_escalation_dto = cls(
            conversation_id=conversation_id,
            contact_email=contact_email,
            callback_url=callback_url,
            reason=reason,
        )

        create_ask_escalation_dto.additional_properties = d
        return create_ask_escalation_dto

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

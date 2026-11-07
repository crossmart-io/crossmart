from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.ask_channel import AskChannel
from ..types import UNSET, Unset

T = TypeVar("T", bound="AskQuestionDto")


@_attrs_define
class AskQuestionDto:
    """
    Attributes:
        question (str): A question about Crossmart, in any language Example: Can I publish the same product to Shopify
            and eBay?.
        conversation_id (str | Unset): The `conversationId` of an earlier answer, to ask a follow-up in the same
            conversation. Only the same caller can continue it, and it expires after 24 hours without a question. Example:
            conv_3q2-7wEXAMPLEd1Yk1x8kz0A6E2r9cP4mT5vW8yB0fH.
        channel (AskChannel | Unset): Where the question comes from, for Crossmart’s statistics only Default:
            AskChannel.API.
        workspace_id (UUID | Unset): For a signed-in person: a workspace they belong to, so Ask can also answer about it
            (listings, plan and usage, stores), read-only. API keys and agents always ask from their own workspace.
    """

    question: str
    conversation_id: str | Unset = UNSET
    channel: AskChannel | Unset = AskChannel.API
    workspace_id: UUID | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        question = self.question

        conversation_id = self.conversation_id

        channel: str | Unset = UNSET
        if not isinstance(self.channel, Unset):
            channel = self.channel.value

        workspace_id: str | Unset = UNSET
        if not isinstance(self.workspace_id, Unset):
            workspace_id = str(self.workspace_id)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "question": question,
            }
        )
        if conversation_id is not UNSET:
            field_dict["conversationId"] = conversation_id
        if channel is not UNSET:
            field_dict["channel"] = channel
        if workspace_id is not UNSET:
            field_dict["workspaceId"] = workspace_id

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        question = d.pop("question")

        conversation_id = d.pop("conversationId", UNSET)

        _channel = d.pop("channel", UNSET)
        channel: AskChannel | Unset
        if isinstance(_channel, Unset):
            channel = UNSET
        else:
            channel = AskChannel(_channel)

        _workspace_id = d.pop("workspaceId", UNSET)
        workspace_id: UUID | Unset
        if isinstance(_workspace_id, Unset):
            workspace_id = UNSET
        else:
            workspace_id = UUID(_workspace_id)

        ask_question_dto = cls(
            question=question,
            conversation_id=conversation_id,
            channel=channel,
            workspace_id=workspace_id,
        )

        ask_question_dto.additional_properties = d
        return ask_question_dto

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

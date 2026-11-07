from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.agent_worker_page_context_dto import AgentWorkerPageContextDto


T = TypeVar("T", bound="SendAgentWorkerMessageDto")


@_attrs_define
class SendAgentWorkerMessageDto:
    """
    Attributes:
        text (str):  Example: Fix my failed eBay listings.
        context (AgentWorkerPageContextDto | Unset):
    """

    text: str
    context: AgentWorkerPageContextDto | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        text = self.text

        context: dict[str, Any] | Unset = UNSET
        if not isinstance(self.context, Unset):
            context = self.context.to_dict()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "text": text,
            }
        )
        if context is not UNSET:
            field_dict["context"] = context

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.agent_worker_page_context_dto import AgentWorkerPageContextDto

        d = dict(src_dict)
        text = d.pop("text")

        _context = d.pop("context", UNSET)
        context: AgentWorkerPageContextDto | Unset
        if isinstance(_context, Unset):
            context = UNSET
        else:
            context = AgentWorkerPageContextDto.from_dict(_context)

        send_agent_worker_message_dto = cls(
            text=text,
            context=context,
        )

        send_agent_worker_message_dto.additional_properties = d
        return send_agent_worker_message_dto

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

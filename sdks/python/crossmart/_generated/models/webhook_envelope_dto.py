from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.webhook_event_type import WebhookEventType

if TYPE_CHECKING:
    from ..models.webhook_envelope_dto_data import WebhookEnvelopeDtoData


T = TypeVar("T", bound="WebhookEnvelopeDto")


@_attrs_define
class WebhookEnvelopeDto:
    """
    Attributes:
        id (UUID): The event id: deduplicate on it
        type_ (WebhookEventType):
        created_at (str): When the change happened
        workspace_id (UUID):
        api_version (str):  Example: v1.
        data (WebhookEnvelopeDtoData): The event’s data; its shape depends on the type
    """

    id: UUID
    type_: WebhookEventType
    created_at: str
    workspace_id: UUID
    api_version: str
    data: WebhookEnvelopeDtoData
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        type_ = self.type_.value

        created_at = self.created_at

        workspace_id = str(self.workspace_id)

        api_version = self.api_version

        data = self.data.to_dict()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "type": type_,
                "createdAt": created_at,
                "workspaceId": workspace_id,
                "apiVersion": api_version,
                "data": data,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.webhook_envelope_dto_data import WebhookEnvelopeDtoData

        d = dict(src_dict)
        id = UUID(d.pop("id"))

        type_ = WebhookEventType(d.pop("type"))

        created_at = d.pop("createdAt")

        workspace_id = UUID(d.pop("workspaceId"))

        api_version = d.pop("apiVersion")

        data = WebhookEnvelopeDtoData.from_dict(d.pop("data"))

        webhook_envelope_dto = cls(
            id=id,
            type_=type_,
            created_at=created_at,
            workspace_id=workspace_id,
            api_version=api_version,
            data=data,
        )

        webhook_envelope_dto.additional_properties = d
        return webhook_envelope_dto

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

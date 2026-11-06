from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.webhook_event_type import WebhookEventType
from ..types import UNSET, Unset

T = TypeVar("T", bound="UpdateWebhookEndpointDto")


@_attrs_define
class UpdateWebhookEndpointDto:
    """
    Attributes:
        url (str | Unset): Where events are POSTed. https and a public address; plain http only outside production.
        description (None | str | Unset):
        event_types (list[WebhookEventType] | Unset): The events to receive. `webhook.test` cannot be subscribed to.
        enabled (bool | Unset): false turns the endpoint off; true turns it back on and clears its failures
    """

    url: str | Unset = UNSET
    description: None | str | Unset = UNSET
    event_types: list[WebhookEventType] | Unset = UNSET
    enabled: bool | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        url = self.url

        description: None | str | Unset
        if isinstance(self.description, Unset):
            description = UNSET
        else:
            description = self.description

        event_types: list[str] | Unset = UNSET
        if not isinstance(self.event_types, Unset):
            event_types = []
            for event_types_item_data in self.event_types:
                event_types_item = event_types_item_data.value
                event_types.append(event_types_item)

        enabled = self.enabled

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if url is not UNSET:
            field_dict["url"] = url
        if description is not UNSET:
            field_dict["description"] = description
        if event_types is not UNSET:
            field_dict["eventTypes"] = event_types
        if enabled is not UNSET:
            field_dict["enabled"] = enabled

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        url = d.pop("url", UNSET)

        def _parse_description(data: object) -> None | str | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            return cast(None | str | Unset, data)

        description = _parse_description(d.pop("description", UNSET))

        _event_types = d.pop("eventTypes", UNSET)
        event_types: list[WebhookEventType] | Unset = UNSET
        if _event_types is not UNSET:
            event_types = []
            for event_types_item_data in _event_types:
                event_types_item = WebhookEventType(event_types_item_data)

                event_types.append(event_types_item)

        enabled = d.pop("enabled", UNSET)

        update_webhook_endpoint_dto = cls(
            url=url,
            description=description,
            event_types=event_types,
            enabled=enabled,
        )

        update_webhook_endpoint_dto.additional_properties = d
        return update_webhook_endpoint_dto

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

from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.webhook_disabled_reason import WebhookDisabledReason
from ..models.webhook_event_type import WebhookEventType

T = TypeVar("T", bound="WebhookEndpointDto")


@_attrs_define
class WebhookEndpointDto:
    """
    Attributes:
        id (UUID):
        url (str):  Example: https://example.com/crossmart/webhooks.
        description (None | str):  Example: Order notifications to n8n.
        event_types (list[WebhookEventType]):
        enabled (bool): False when turned off by someone or after repeated failures
        disabled_reason (None | WebhookDisabledReason): MANUAL: turned off by someone. FAILING: turned off by Crossmart.
        disabled_at (datetime.datetime | None):
        consecutive_failures (float): Failed attempts since the last delivery that went through
        previous_secret_expires_at (datetime.datetime | None): Until then deliveries are also signed with the secret the
            last rotation replaced
        created_at (datetime.datetime):
        updated_at (datetime.datetime):
    """

    id: UUID
    url: str
    description: None | str
    event_types: list[WebhookEventType]
    enabled: bool
    disabled_reason: None | WebhookDisabledReason
    disabled_at: datetime.datetime | None
    consecutive_failures: float
    previous_secret_expires_at: datetime.datetime | None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        url = self.url

        description: None | str
        description = self.description

        event_types = []
        for event_types_item_data in self.event_types:
            event_types_item = event_types_item_data.value
            event_types.append(event_types_item)

        enabled = self.enabled

        disabled_reason: None | str
        if isinstance(self.disabled_reason, WebhookDisabledReason):
            disabled_reason = self.disabled_reason.value
        else:
            disabled_reason = self.disabled_reason

        disabled_at: None | str
        if isinstance(self.disabled_at, datetime.datetime):
            disabled_at = self.disabled_at.isoformat()
        else:
            disabled_at = self.disabled_at

        consecutive_failures = self.consecutive_failures

        previous_secret_expires_at: None | str
        if isinstance(self.previous_secret_expires_at, datetime.datetime):
            previous_secret_expires_at = self.previous_secret_expires_at.isoformat()
        else:
            previous_secret_expires_at = self.previous_secret_expires_at

        created_at = self.created_at.isoformat()

        updated_at = self.updated_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "url": url,
                "description": description,
                "eventTypes": event_types,
                "enabled": enabled,
                "disabledReason": disabled_reason,
                "disabledAt": disabled_at,
                "consecutiveFailures": consecutive_failures,
                "previousSecretExpiresAt": previous_secret_expires_at,
                "createdAt": created_at,
                "updatedAt": updated_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        id = UUID(d.pop("id"))

        url = d.pop("url")

        def _parse_description(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        description = _parse_description(d.pop("description"))

        event_types = []
        _event_types = d.pop("eventTypes")
        for event_types_item_data in _event_types:
            event_types_item = WebhookEventType(event_types_item_data)

            event_types.append(event_types_item)

        enabled = d.pop("enabled")

        def _parse_disabled_reason(data: object) -> None | WebhookDisabledReason:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                disabled_reason_type_0 = WebhookDisabledReason(data)

                return disabled_reason_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | WebhookDisabledReason, data)

        disabled_reason = _parse_disabled_reason(d.pop("disabledReason"))

        def _parse_disabled_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                disabled_at_type_0 = datetime.datetime.fromisoformat(data)

                return disabled_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        disabled_at = _parse_disabled_at(d.pop("disabledAt"))

        consecutive_failures = d.pop("consecutiveFailures")

        def _parse_previous_secret_expires_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                previous_secret_expires_at_type_0 = datetime.datetime.fromisoformat(
                    data
                )

                return previous_secret_expires_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        previous_secret_expires_at = _parse_previous_secret_expires_at(
            d.pop("previousSecretExpiresAt")
        )

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        updated_at = datetime.datetime.fromisoformat(d.pop("updatedAt"))

        webhook_endpoint_dto = cls(
            id=id,
            url=url,
            description=description,
            event_types=event_types,
            enabled=enabled,
            disabled_reason=disabled_reason,
            disabled_at=disabled_at,
            consecutive_failures=consecutive_failures,
            previous_secret_expires_at=previous_secret_expires_at,
            created_at=created_at,
            updated_at=updated_at,
        )

        webhook_endpoint_dto.additional_properties = d
        return webhook_endpoint_dto

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

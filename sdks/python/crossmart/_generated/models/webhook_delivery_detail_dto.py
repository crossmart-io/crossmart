from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.webhook_delivery_status import WebhookDeliveryStatus
from ..models.webhook_event_type import WebhookEventType

if TYPE_CHECKING:
    from ..models.webhook_envelope_dto import WebhookEnvelopeDto


T = TypeVar("T", bound="WebhookDeliveryDetailDto")


@_attrs_define
class WebhookDeliveryDetailDto:
    """
    Attributes:
        id (UUID): Sent as the Crossmart-Delivery-Id header
        endpoint_id (UUID):
        event_id (UUID): The event id; the same on every redelivery
        event_type (WebhookEventType):
        status (WebhookDeliveryStatus):
        attempts (float): Attempts made so far
        response_status (float | None): HTTP status of the latest attempt
        duration_ms (float | None):
        error (None | str): Why the latest attempt failed
        next_attempt_at (datetime.datetime | None):
        last_attempt_at (datetime.datetime | None):
        delivered_at (datetime.datetime | None):
        created_at (datetime.datetime):
        payload (WebhookEnvelopeDto):
    """

    id: UUID
    endpoint_id: UUID
    event_id: UUID
    event_type: WebhookEventType
    status: WebhookDeliveryStatus
    attempts: float
    response_status: float | None
    duration_ms: float | None
    error: None | str
    next_attempt_at: datetime.datetime | None
    last_attempt_at: datetime.datetime | None
    delivered_at: datetime.datetime | None
    created_at: datetime.datetime
    payload: WebhookEnvelopeDto
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        endpoint_id = str(self.endpoint_id)

        event_id = str(self.event_id)

        event_type = self.event_type.value

        status = self.status.value

        attempts = self.attempts

        response_status: float | None
        response_status = self.response_status

        duration_ms: float | None
        duration_ms = self.duration_ms

        error: None | str
        error = self.error

        next_attempt_at: None | str
        if isinstance(self.next_attempt_at, datetime.datetime):
            next_attempt_at = self.next_attempt_at.isoformat()
        else:
            next_attempt_at = self.next_attempt_at

        last_attempt_at: None | str
        if isinstance(self.last_attempt_at, datetime.datetime):
            last_attempt_at = self.last_attempt_at.isoformat()
        else:
            last_attempt_at = self.last_attempt_at

        delivered_at: None | str
        if isinstance(self.delivered_at, datetime.datetime):
            delivered_at = self.delivered_at.isoformat()
        else:
            delivered_at = self.delivered_at

        created_at = self.created_at.isoformat()

        payload = self.payload.to_dict()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "endpointId": endpoint_id,
                "eventId": event_id,
                "eventType": event_type,
                "status": status,
                "attempts": attempts,
                "responseStatus": response_status,
                "durationMs": duration_ms,
                "error": error,
                "nextAttemptAt": next_attempt_at,
                "lastAttemptAt": last_attempt_at,
                "deliveredAt": delivered_at,
                "createdAt": created_at,
                "payload": payload,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.webhook_envelope_dto import WebhookEnvelopeDto

        d = dict(src_dict)
        id = UUID(d.pop("id"))

        endpoint_id = UUID(d.pop("endpointId"))

        event_id = UUID(d.pop("eventId"))

        event_type = WebhookEventType(d.pop("eventType"))

        status = WebhookDeliveryStatus(d.pop("status"))

        attempts = d.pop("attempts")

        def _parse_response_status(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        response_status = _parse_response_status(d.pop("responseStatus"))

        def _parse_duration_ms(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        duration_ms = _parse_duration_ms(d.pop("durationMs"))

        def _parse_error(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        error = _parse_error(d.pop("error"))

        def _parse_next_attempt_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                next_attempt_at_type_0 = datetime.datetime.fromisoformat(data)

                return next_attempt_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        next_attempt_at = _parse_next_attempt_at(d.pop("nextAttemptAt"))

        def _parse_last_attempt_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                last_attempt_at_type_0 = datetime.datetime.fromisoformat(data)

                return last_attempt_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        last_attempt_at = _parse_last_attempt_at(d.pop("lastAttemptAt"))

        def _parse_delivered_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                delivered_at_type_0 = datetime.datetime.fromisoformat(data)

                return delivered_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        delivered_at = _parse_delivered_at(d.pop("deliveredAt"))

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        payload = WebhookEnvelopeDto.from_dict(d.pop("payload"))

        webhook_delivery_detail_dto = cls(
            id=id,
            endpoint_id=endpoint_id,
            event_id=event_id,
            event_type=event_type,
            status=status,
            attempts=attempts,
            response_status=response_status,
            duration_ms=duration_ms,
            error=error,
            next_attempt_at=next_attempt_at,
            last_attempt_at=last_attempt_at,
            delivered_at=delivered_at,
            created_at=created_at,
            payload=payload,
        )

        webhook_delivery_detail_dto.additional_properties = d
        return webhook_delivery_detail_dto

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

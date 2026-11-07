from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.webhook_attempt_outcome import WebhookAttemptOutcome

T = TypeVar("T", bound="WebhookEndpointLastDeliveryDto")


@_attrs_define
class WebhookEndpointLastDeliveryDto:
    """
    Attributes:
        attempted_at (datetime.datetime):
        outcome (WebhookAttemptOutcome): SUCCEEDED: the endpoint answered 2xx. FAILED: anything else, or no answer.
        response_status (float | None): Null when no response came: a timeout or a connection error Example: 200.
        error (None | str): Why the attempt failed; null on success Example: The endpoint answered with HTTP 503.
    """

    attempted_at: datetime.datetime
    outcome: WebhookAttemptOutcome
    response_status: float | None
    error: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        attempted_at = self.attempted_at.isoformat()

        outcome = self.outcome.value

        response_status: float | None
        response_status = self.response_status

        error: None | str
        error = self.error

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "attemptedAt": attempted_at,
                "outcome": outcome,
                "responseStatus": response_status,
                "error": error,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        attempted_at = datetime.datetime.fromisoformat(d.pop("attemptedAt"))

        outcome = WebhookAttemptOutcome(d.pop("outcome"))

        def _parse_response_status(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        response_status = _parse_response_status(d.pop("responseStatus"))

        def _parse_error(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        error = _parse_error(d.pop("error"))

        webhook_endpoint_last_delivery_dto = cls(
            attempted_at=attempted_at,
            outcome=outcome,
            response_status=response_status,
            error=error,
        )

        webhook_endpoint_last_delivery_dto.additional_properties = d
        return webhook_endpoint_last_delivery_dto

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

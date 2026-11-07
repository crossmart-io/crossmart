from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.subscription_access_state import SubscriptionAccessState

T = TypeVar("T", bound="SubscriptionAccessDto")


@_attrs_define
class SubscriptionAccessDto:
    """
    Attributes:
        state (SubscriptionAccessState):
        writable (bool): False when the organization is read-only. Changes are refused (402 `subscription_inactive`)
            only while `enforced` is true
        enforced (bool): Whether a read-only organization is refused changes on this instance
        until (datetime.datetime | None): When the state ends on its own: the trial, the past-due grace period, or
            access for organizations from before billing. Null when it does not
    """

    state: SubscriptionAccessState
    writable: bool
    enforced: bool
    until: datetime.datetime | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        state = self.state.value

        writable = self.writable

        enforced = self.enforced

        until: None | str
        if isinstance(self.until, datetime.datetime):
            until = self.until.isoformat()
        else:
            until = self.until

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "state": state,
                "writable": writable,
                "enforced": enforced,
                "until": until,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        state = SubscriptionAccessState(d.pop("state"))

        writable = d.pop("writable")

        enforced = d.pop("enforced")

        def _parse_until(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                until_type_0 = datetime.datetime.fromisoformat(data)

                return until_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        until = _parse_until(d.pop("until"))

        subscription_access_dto = cls(
            state=state,
            writable=writable,
            enforced=enforced,
            until=until,
        )

        subscription_access_dto.additional_properties = d
        return subscription_access_dto

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

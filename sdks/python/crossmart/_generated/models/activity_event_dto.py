from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.activity_action import ActivityAction
from ..models.activity_outcome import ActivityOutcome

if TYPE_CHECKING:
    from ..models.activity_actor_dto import ActivityActorDto
    from ..models.activity_subject_dto import ActivitySubjectDto


T = TypeVar("T", bound="ActivityEventDto")


@_attrs_define
class ActivityEventDto:
    """
    Attributes:
        id (UUID):
        action (ActivityAction):
        outcome (ActivityOutcome):
        summary (str):  Example: Updated product “Linen Shirt”.
        actor (ActivityActorDto):
        subject (ActivitySubjectDto | None):
        item_count (float | None): Items the action covered, such as products changed in bulk
        failure_reason (None | str): Why a failed action failed
        created_at (datetime.datetime):
    """

    id: UUID
    action: ActivityAction
    outcome: ActivityOutcome
    summary: str
    actor: ActivityActorDto
    subject: ActivitySubjectDto | None
    item_count: float | None
    failure_reason: None | str
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.activity_subject_dto import ActivitySubjectDto

        id = str(self.id)

        action = self.action.value

        outcome = self.outcome.value

        summary = self.summary

        actor = self.actor.to_dict()

        subject: dict[str, Any] | None
        if isinstance(self.subject, ActivitySubjectDto):
            subject = self.subject.to_dict()
        else:
            subject = self.subject

        item_count: float | None
        item_count = self.item_count

        failure_reason: None | str
        failure_reason = self.failure_reason

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "action": action,
                "outcome": outcome,
                "summary": summary,
                "actor": actor,
                "subject": subject,
                "itemCount": item_count,
                "failureReason": failure_reason,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.activity_actor_dto import ActivityActorDto
        from ..models.activity_subject_dto import ActivitySubjectDto

        d = dict(src_dict)
        id = UUID(d.pop("id"))

        action = ActivityAction(d.pop("action"))

        outcome = ActivityOutcome(d.pop("outcome"))

        summary = d.pop("summary")

        actor = ActivityActorDto.from_dict(d.pop("actor"))

        def _parse_subject(data: object) -> ActivitySubjectDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                subject_type_0 = ActivitySubjectDto.from_dict(data)

                return subject_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(ActivitySubjectDto | None, data)

        subject = _parse_subject(d.pop("subject"))

        def _parse_item_count(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        item_count = _parse_item_count(d.pop("itemCount"))

        def _parse_failure_reason(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        failure_reason = _parse_failure_reason(d.pop("failureReason"))

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        activity_event_dto = cls(
            id=id,
            action=action,
            outcome=outcome,
            summary=summary,
            actor=actor,
            subject=subject,
            item_count=item_count,
            failure_reason=failure_reason,
            created_at=created_at,
        )

        activity_event_dto.additional_properties = d
        return activity_event_dto

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

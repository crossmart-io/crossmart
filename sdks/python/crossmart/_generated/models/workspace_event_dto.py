from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.workspace_event_category import WorkspaceEventCategory
from ..models.workspace_event_severity import WorkspaceEventSeverity
from ..models.workspace_event_type import WorkspaceEventType

if TYPE_CHECKING:
    from ..models.workspace_event_actor_dto import WorkspaceEventActorDto
    from ..models.workspace_event_refs_dto import WorkspaceEventRefsDto


T = TypeVar("T", bound="WorkspaceEventDto")


@_attrs_define
class WorkspaceEventDto:
    """
    Attributes:
        id (str): Stable across reads Example: activity:0193f7c2-….
        cursor (str): Pass as `after` (or `Last-Event-ID`) to read what follows it
        type_ (WorkspaceEventType):
        category (WorkspaceEventCategory):
        severity (WorkspaceEventSeverity):
        summary (str):  Example: Published “Linen Shirt” on Outlet.
        detail (None | str): More to read: the store’s error, what a read found, an order’s total
        actor (WorkspaceEventActorDto):
        refs (WorkspaceEventRefsDto):
        item_count (float | None): Items the event covered
        occurred_at (datetime.datetime):
    """

    id: str
    cursor: str
    type_: WorkspaceEventType
    category: WorkspaceEventCategory
    severity: WorkspaceEventSeverity
    summary: str
    detail: None | str
    actor: WorkspaceEventActorDto
    refs: WorkspaceEventRefsDto
    item_count: float | None
    occurred_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = self.id

        cursor = self.cursor

        type_ = self.type_.value

        category = self.category.value

        severity = self.severity.value

        summary = self.summary

        detail: None | str
        detail = self.detail

        actor = self.actor.to_dict()

        refs = self.refs.to_dict()

        item_count: float | None
        item_count = self.item_count

        occurred_at = self.occurred_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "cursor": cursor,
                "type": type_,
                "category": category,
                "severity": severity,
                "summary": summary,
                "detail": detail,
                "actor": actor,
                "refs": refs,
                "itemCount": item_count,
                "occurredAt": occurred_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.workspace_event_actor_dto import WorkspaceEventActorDto
        from ..models.workspace_event_refs_dto import WorkspaceEventRefsDto

        d = dict(src_dict)
        id = d.pop("id")

        cursor = d.pop("cursor")

        type_ = WorkspaceEventType(d.pop("type"))

        category = WorkspaceEventCategory(d.pop("category"))

        severity = WorkspaceEventSeverity(d.pop("severity"))

        summary = d.pop("summary")

        def _parse_detail(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        detail = _parse_detail(d.pop("detail"))

        actor = WorkspaceEventActorDto.from_dict(d.pop("actor"))

        refs = WorkspaceEventRefsDto.from_dict(d.pop("refs"))

        def _parse_item_count(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        item_count = _parse_item_count(d.pop("itemCount"))

        occurred_at = datetime.datetime.fromisoformat(d.pop("occurredAt"))

        workspace_event_dto = cls(
            id=id,
            cursor=cursor,
            type_=type_,
            category=category,
            severity=severity,
            summary=summary,
            detail=detail,
            actor=actor,
            refs=refs,
            item_count=item_count,
            occurred_at=occurred_at,
        )

        workspace_event_dto.additional_properties = d
        return workspace_event_dto

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

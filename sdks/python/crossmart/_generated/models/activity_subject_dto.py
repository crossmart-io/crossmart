from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.activity_subject_type import ActivitySubjectType

T = TypeVar("T", bound="ActivitySubjectDto")


@_attrs_define
class ActivitySubjectDto:
    """
    Attributes:
        type_ (ActivitySubjectType):
        id (None | UUID):
        label (None | str): The name when the event happened
    """

    type_: ActivitySubjectType
    id: None | UUID
    label: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        type_ = self.type_.value

        id: None | str
        if isinstance(self.id, UUID):
            id = str(self.id)
        else:
            id = self.id

        label: None | str
        label = self.label

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "type": type_,
                "id": id,
                "label": label,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        type_ = ActivitySubjectType(d.pop("type"))

        def _parse_id(data: object) -> None | UUID:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                id_type_0 = UUID(data)

                return id_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UUID, data)

        id = _parse_id(d.pop("id"))

        def _parse_label(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        label = _parse_label(d.pop("label"))

        activity_subject_dto = cls(
            type_=type_,
            id=id,
            label=label,
        )

        activity_subject_dto.additional_properties = d
        return activity_subject_dto

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

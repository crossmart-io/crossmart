from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="SuggestionReviewDto")


@_attrs_define
class SuggestionReviewDto:
    """
    Attributes:
        user_id (None | UUID):
        api_key_id (None | UUID):
        name (None | str):
        reviewed_at (datetime.datetime):
    """

    user_id: None | UUID
    api_key_id: None | UUID
    name: None | str
    reviewed_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        user_id: None | str
        if isinstance(self.user_id, UUID):
            user_id = str(self.user_id)
        else:
            user_id = self.user_id

        api_key_id: None | str
        if isinstance(self.api_key_id, UUID):
            api_key_id = str(self.api_key_id)
        else:
            api_key_id = self.api_key_id

        name: None | str
        name = self.name

        reviewed_at = self.reviewed_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "userId": user_id,
                "apiKeyId": api_key_id,
                "name": name,
                "reviewedAt": reviewed_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)

        def _parse_user_id(data: object) -> None | UUID:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                user_id_type_0 = UUID(data)

                return user_id_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UUID, data)

        user_id = _parse_user_id(d.pop("userId"))

        def _parse_api_key_id(data: object) -> None | UUID:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                api_key_id_type_0 = UUID(data)

                return api_key_id_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UUID, data)

        api_key_id = _parse_api_key_id(d.pop("apiKeyId"))

        def _parse_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        name = _parse_name(d.pop("name"))

        reviewed_at = datetime.datetime.fromisoformat(d.pop("reviewedAt"))

        suggestion_review_dto = cls(
            user_id=user_id,
            api_key_id=api_key_id,
            name=name,
            reviewed_at=reviewed_at,
        )

        suggestion_review_dto.additional_properties = d
        return suggestion_review_dto

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

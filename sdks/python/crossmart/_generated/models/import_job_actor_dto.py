from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="ImportJobActorDto")


@_attrs_define
class ImportJobActorDto:
    """
    Attributes:
        user_id (None | UUID):
        user_name (None | str): The user who sent the file; null for API keys and deleted users
        api_key_id (None | UUID):
        api_key_name (None | str): The API key that sent the file, if one did
    """

    user_id: None | UUID
    user_name: None | str
    api_key_id: None | UUID
    api_key_name: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        user_id: None | str
        if isinstance(self.user_id, UUID):
            user_id = str(self.user_id)
        else:
            user_id = self.user_id

        user_name: None | str
        user_name = self.user_name

        api_key_id: None | str
        if isinstance(self.api_key_id, UUID):
            api_key_id = str(self.api_key_id)
        else:
            api_key_id = self.api_key_id

        api_key_name: None | str
        api_key_name = self.api_key_name

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "userId": user_id,
                "userName": user_name,
                "apiKeyId": api_key_id,
                "apiKeyName": api_key_name,
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

        def _parse_user_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        user_name = _parse_user_name(d.pop("userName"))

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

        def _parse_api_key_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        api_key_name = _parse_api_key_name(d.pop("apiKeyName"))

        import_job_actor_dto = cls(
            user_id=user_id,
            user_name=user_name,
            api_key_id=api_key_id,
            api_key_name=api_key_name,
        )

        import_job_actor_dto.additional_properties = d
        return import_job_actor_dto

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

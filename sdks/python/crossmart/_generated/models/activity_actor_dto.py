from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.activity_actor_type import ActivityActorType

T = TypeVar("T", bound="ActivityActorDto")


@_attrs_define
class ActivityActorDto:
    """
    Attributes:
        type_ (ActivityActorType):
        user_id (None | UUID):
        api_key_id (None | UUID):
        agent_client_id (None | str): The OAuth client id of the connected agent, for agent actions
        name (None | str): User or API key name; for an agent, the user it acted for. Null for system actions and
            deleted users or keys
        email (None | str): Set for users, and for the user an agent acted for
        agent_name (None | str): The agent's name, such as "Claude", for agent actions
        approved_by_user_id (None | UUID): Who approved the outside agent's proposal that made this change; null when
            nobody had to
        approved_by_name (None | str): Their name, for "Claude for Dana, approved by Lee"; null when deleted or none
    """

    type_: ActivityActorType
    user_id: None | UUID
    api_key_id: None | UUID
    agent_client_id: None | str
    name: None | str
    email: None | str
    agent_name: None | str
    approved_by_user_id: None | UUID
    approved_by_name: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        type_ = self.type_.value

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

        agent_client_id: None | str
        agent_client_id = self.agent_client_id

        name: None | str
        name = self.name

        email: None | str
        email = self.email

        agent_name: None | str
        agent_name = self.agent_name

        approved_by_user_id: None | str
        if isinstance(self.approved_by_user_id, UUID):
            approved_by_user_id = str(self.approved_by_user_id)
        else:
            approved_by_user_id = self.approved_by_user_id

        approved_by_name: None | str
        approved_by_name = self.approved_by_name

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "type": type_,
                "userId": user_id,
                "apiKeyId": api_key_id,
                "agentClientId": agent_client_id,
                "name": name,
                "email": email,
                "agentName": agent_name,
                "approvedByUserId": approved_by_user_id,
                "approvedByName": approved_by_name,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        type_ = ActivityActorType(d.pop("type"))

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

        def _parse_agent_client_id(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        agent_client_id = _parse_agent_client_id(d.pop("agentClientId"))

        def _parse_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        name = _parse_name(d.pop("name"))

        def _parse_email(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        email = _parse_email(d.pop("email"))

        def _parse_agent_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        agent_name = _parse_agent_name(d.pop("agentName"))

        def _parse_approved_by_user_id(data: object) -> None | UUID:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                approved_by_user_id_type_0 = UUID(data)

                return approved_by_user_id_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UUID, data)

        approved_by_user_id = _parse_approved_by_user_id(d.pop("approvedByUserId"))

        def _parse_approved_by_name(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        approved_by_name = _parse_approved_by_name(d.pop("approvedByName"))

        activity_actor_dto = cls(
            type_=type_,
            user_id=user_id,
            api_key_id=api_key_id,
            agent_client_id=agent_client_id,
            name=name,
            email=email,
            agent_name=agent_name,
            approved_by_user_id=approved_by_user_id,
            approved_by_name=approved_by_name,
        )

        activity_actor_dto.additional_properties = d
        return activity_actor_dto

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

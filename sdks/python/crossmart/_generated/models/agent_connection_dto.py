from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.agent_client_registration import AgentClientRegistration
from ..models.agent_scope import AgentScope

T = TypeVar("T", bound="AgentConnectionDto")


@_attrs_define
class AgentConnectionDto:
    """
    Attributes:
        id (UUID):
        client_id (str): The OAuth client id: a Client ID Metadata Document URL, or a registered id
        client_name (str): The name the agent gives, such as "Claude"
        client_registration (AgentClientRegistration): `metadata_document`: Crossmart fetched the agent’s metadata from
            its HTTPS client id. `dynamic`: the agent registered itself, and its name and site are unverified.
        client_verified_host (None | str): For a `metadata_document` client: the host its metadata came from
        client_uri (None | str): The agent’s home page
        client_icon (None | str): The agent’s logo address, from its metadata. Crossmart never fetches it.
        user_id (UUID): The member who connected the agent
        user_name (str):
        user_email (str):
        scopes (list[AgentScope]):
        connected_at (datetime.datetime):
    """

    id: UUID
    client_id: str
    client_name: str
    client_registration: AgentClientRegistration
    client_verified_host: None | str
    client_uri: None | str
    client_icon: None | str
    user_id: UUID
    user_name: str
    user_email: str
    scopes: list[AgentScope]
    connected_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        client_id = self.client_id

        client_name = self.client_name

        client_registration = self.client_registration.value

        client_verified_host: None | str
        client_verified_host = self.client_verified_host

        client_uri: None | str
        client_uri = self.client_uri

        client_icon: None | str
        client_icon = self.client_icon

        user_id = str(self.user_id)

        user_name = self.user_name

        user_email = self.user_email

        scopes = []
        for scopes_item_data in self.scopes:
            scopes_item = scopes_item_data.value
            scopes.append(scopes_item)

        connected_at = self.connected_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "clientId": client_id,
                "clientName": client_name,
                "clientRegistration": client_registration,
                "clientVerifiedHost": client_verified_host,
                "clientUri": client_uri,
                "clientIcon": client_icon,
                "userId": user_id,
                "userName": user_name,
                "userEmail": user_email,
                "scopes": scopes,
                "connectedAt": connected_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        id = UUID(d.pop("id"))

        client_id = d.pop("clientId")

        client_name = d.pop("clientName")

        client_registration = AgentClientRegistration(d.pop("clientRegistration"))

        def _parse_client_verified_host(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        client_verified_host = _parse_client_verified_host(d.pop("clientVerifiedHost"))

        def _parse_client_uri(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        client_uri = _parse_client_uri(d.pop("clientUri"))

        def _parse_client_icon(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        client_icon = _parse_client_icon(d.pop("clientIcon"))

        user_id = UUID(d.pop("userId"))

        user_name = d.pop("userName")

        user_email = d.pop("userEmail")

        scopes = []
        _scopes = d.pop("scopes")
        for scopes_item_data in _scopes:
            scopes_item = AgentScope(scopes_item_data)

            scopes.append(scopes_item)

        connected_at = datetime.datetime.fromisoformat(d.pop("connectedAt"))

        agent_connection_dto = cls(
            id=id,
            client_id=client_id,
            client_name=client_name,
            client_registration=client_registration,
            client_verified_host=client_verified_host,
            client_uri=client_uri,
            client_icon=client_icon,
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
            scopes=scopes,
            connected_at=connected_at,
        )

        agent_connection_dto.additional_properties = d
        return agent_connection_dto

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

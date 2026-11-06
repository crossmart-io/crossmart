from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.agent_client_registration import AgentClientRegistration

T = TypeVar("T", bound="AgentClientDto")


@_attrs_define
class AgentClientDto:
    """
    Attributes:
        client_id (str): The OAuth client id: a Client ID Metadata Document URL, or a registered id
        name (str): The name to show. Verified only for a `metadata_document` client, through `verifiedHost`; a
            `dynamic` client chose it itself, and any client can call itself "Claude".
        registration (AgentClientRegistration): `metadata_document`: Crossmart fetched the agent’s metadata from its
            HTTPS client id. `dynamic`: the agent registered itself, and its name and site are unverified.
        verified_host (None | str): For a `metadata_document` client: the host its metadata came from Example:
            claude.ai.
        claimed_host (None | str): For a `dynamic` client: the HTTPS host of the site it claims. Not verified.
    """

    client_id: str
    name: str
    registration: AgentClientRegistration
    verified_host: None | str
    claimed_host: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        client_id = self.client_id

        name = self.name

        registration = self.registration.value

        verified_host: None | str
        verified_host = self.verified_host

        claimed_host: None | str
        claimed_host = self.claimed_host

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "clientId": client_id,
                "name": name,
                "registration": registration,
                "verifiedHost": verified_host,
                "claimedHost": claimed_host,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        client_id = d.pop("clientId")

        name = d.pop("name")

        registration = AgentClientRegistration(d.pop("registration"))

        def _parse_verified_host(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        verified_host = _parse_verified_host(d.pop("verifiedHost"))

        def _parse_claimed_host(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        claimed_host = _parse_claimed_host(d.pop("claimedHost"))

        agent_client_dto = cls(
            client_id=client_id,
            name=name,
            registration=registration,
            verified_host=verified_host,
            claimed_host=claimed_host,
        )

        agent_client_dto.additional_properties = d
        return agent_client_dto

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

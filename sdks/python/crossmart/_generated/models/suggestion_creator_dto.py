from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.suggestion_agent import SuggestionAgent
from ..models.suggestion_creator_type import SuggestionCreatorType

T = TypeVar("T", bound="SuggestionCreatorDto")


@_attrs_define
class SuggestionCreatorDto:
    """
    Attributes:
        type_ (SuggestionCreatorType):
        agent (None | SuggestionAgent): The agent that made it, for `AGENT` suggestions
        user_id (None | UUID): Who asked for it
        api_key_id (None | UUID):
        name (None | str): The user’s or API key’s name
    """

    type_: SuggestionCreatorType
    agent: None | SuggestionAgent
    user_id: None | UUID
    api_key_id: None | UUID
    name: None | str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        type_ = self.type_.value

        agent: None | str
        if isinstance(self.agent, SuggestionAgent):
            agent = self.agent.value
        else:
            agent = self.agent

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

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "type": type_,
                "agent": agent,
                "userId": user_id,
                "apiKeyId": api_key_id,
                "name": name,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        type_ = SuggestionCreatorType(d.pop("type"))

        def _parse_agent(data: object) -> None | SuggestionAgent:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                agent_type_0 = SuggestionAgent(data)

                return agent_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | SuggestionAgent, data)

        agent = _parse_agent(d.pop("agent"))

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

        suggestion_creator_dto = cls(
            type_=type_,
            agent=agent,
            user_id=user_id,
            api_key_id=api_key_id,
            name=name,
        )

        suggestion_creator_dto.additional_properties = d
        return suggestion_creator_dto

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

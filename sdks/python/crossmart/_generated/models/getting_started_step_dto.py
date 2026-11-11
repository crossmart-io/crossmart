from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.getting_started_step import GettingStartedStep
from ..models.getting_started_step_owner import GettingStartedStepOwner
from ..models.getting_started_step_state import GettingStartedStepState

T = TypeVar("T", bound="GettingStartedStepDto")


@_attrs_define
class GettingStartedStepDto:
    """
    Attributes:
        step (GettingStartedStep): The first step still to take; null once every step is done
        state (GettingStartedStepState):
        owner (GettingStartedStepOwner): `merchant`: only the seller can take it, in the app; `agent`: with `tools`
        title (str):  Example: Connect a store.
        detail (str):
        url (None | str): The page of the web app where the seller takes it
        tools (list[str]): Agent tools Example: ['create_product'].
    """

    step: GettingStartedStep
    state: GettingStartedStepState
    owner: GettingStartedStepOwner
    title: str
    detail: str
    url: None | str
    tools: list[str]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        step = self.step.value

        state = self.state.value

        owner = self.owner.value

        title = self.title

        detail = self.detail

        url: None | str
        url = self.url

        tools = self.tools

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "step": step,
                "state": state,
                "owner": owner,
                "title": title,
                "detail": detail,
                "url": url,
                "tools": tools,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        step = GettingStartedStep(d.pop("step"))

        state = GettingStartedStepState(d.pop("state"))

        owner = GettingStartedStepOwner(d.pop("owner"))

        title = d.pop("title")

        detail = d.pop("detail")

        def _parse_url(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        url = _parse_url(d.pop("url"))

        tools = cast(list[str], d.pop("tools"))

        getting_started_step_dto = cls(
            step=step,
            state=state,
            owner=owner,
            title=title,
            detail=detail,
            url=url,
            tools=tools,
        )

        getting_started_step_dto.additional_properties = d
        return getting_started_step_dto

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

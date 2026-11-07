from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.agent_worker_context_view import AgentWorkerContextView
from ..types import UNSET, Unset

T = TypeVar("T", bound="AgentWorkerPageContextDto")


@_attrs_define
class AgentWorkerPageContextDto:
    """
    Attributes:
        view (AgentWorkerContextView | Unset): The page the person wrote from
        product_id (UUID | Unset): The product on screen
        connection_id (UUID | Unset): The store on screen
    """

    view: AgentWorkerContextView | Unset = UNSET
    product_id: UUID | Unset = UNSET
    connection_id: UUID | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        view: str | Unset = UNSET
        if not isinstance(self.view, Unset):
            view = self.view.value

        product_id: str | Unset = UNSET
        if not isinstance(self.product_id, Unset):
            product_id = str(self.product_id)

        connection_id: str | Unset = UNSET
        if not isinstance(self.connection_id, Unset):
            connection_id = str(self.connection_id)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if view is not UNSET:
            field_dict["view"] = view
        if product_id is not UNSET:
            field_dict["productId"] = product_id
        if connection_id is not UNSET:
            field_dict["connectionId"] = connection_id

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        _view = d.pop("view", UNSET)
        view: AgentWorkerContextView | Unset
        if isinstance(_view, Unset):
            view = UNSET
        else:
            view = AgentWorkerContextView(_view)

        _product_id = d.pop("productId", UNSET)
        product_id: UUID | Unset
        if isinstance(_product_id, Unset):
            product_id = UNSET
        else:
            product_id = UUID(_product_id)

        _connection_id = d.pop("connectionId", UNSET)
        connection_id: UUID | Unset
        if isinstance(_connection_id, Unset):
            connection_id = UNSET
        else:
            connection_id = UUID(_connection_id)

        agent_worker_page_context_dto = cls(
            view=view,
            product_id=product_id,
            connection_id=connection_id,
        )

        agent_worker_page_context_dto.additional_properties = d
        return agent_worker_page_context_dto

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

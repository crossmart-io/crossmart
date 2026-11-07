from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.workspace_dto import WorkspaceDto


T = TypeVar("T", bound="MeDto")


@_attrs_define
class MeDto:
    """
    Attributes:
        id (UUID):
        name (str):
        email (str):
        workspaces (list[WorkspaceDto]):
        platform_admin (bool): Whether the user runs this instance (`PLATFORM_ADMIN_EMAILS`, verified): they can read
            Ask Crossmart’s conversations and answer escalations
    """

    id: UUID
    name: str
    email: str
    workspaces: list[WorkspaceDto]
    platform_admin: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        name = self.name

        email = self.email

        workspaces = []
        for workspaces_item_data in self.workspaces:
            workspaces_item = workspaces_item_data.to_dict()
            workspaces.append(workspaces_item)

        platform_admin = self.platform_admin

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "name": name,
                "email": email,
                "workspaces": workspaces,
                "platformAdmin": platform_admin,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.workspace_dto import WorkspaceDto

        d = dict(src_dict)
        id = UUID(d.pop("id"))

        name = d.pop("name")

        email = d.pop("email")

        workspaces = []
        _workspaces = d.pop("workspaces")
        for workspaces_item_data in _workspaces:
            workspaces_item = WorkspaceDto.from_dict(workspaces_item_data)

            workspaces.append(workspaces_item)

        platform_admin = d.pop("platformAdmin")

        me_dto = cls(
            id=id,
            name=name,
            email=email,
            workspaces=workspaces,
            platform_admin=platform_admin,
        )

        me_dto.additional_properties = d
        return me_dto

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

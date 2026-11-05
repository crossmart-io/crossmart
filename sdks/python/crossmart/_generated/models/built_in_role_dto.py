from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.workspace_permission import WorkspacePermission
from ..models.workspace_role import WorkspaceRole

T = TypeVar("T", bound="BuiltInRoleDto")


@_attrs_define
class BuiltInRoleDto:
    """
    Attributes:
        role (WorkspaceRole): Your role here
        permissions (list[WorkspacePermission]):
    """

    role: WorkspaceRole
    permissions: list[WorkspacePermission]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        role = self.role.value

        permissions = []
        for permissions_item_data in self.permissions:
            permissions_item = permissions_item_data.value
            permissions.append(permissions_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "role": role,
                "permissions": permissions,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        role = WorkspaceRole(d.pop("role"))

        permissions = []
        _permissions = d.pop("permissions")
        for permissions_item_data in _permissions:
            permissions_item = WorkspacePermission(permissions_item_data)

            permissions.append(permissions_item)

        built_in_role_dto = cls(
            role=role,
            permissions=permissions,
        )

        built_in_role_dto.additional_properties = d
        return built_in_role_dto

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

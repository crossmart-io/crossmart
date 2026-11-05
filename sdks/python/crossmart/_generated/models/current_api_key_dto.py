from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.workspace_permission import WorkspacePermission
from ..models.workspace_role import WorkspaceRole

if TYPE_CHECKING:
    from ..models.custom_role_ref_dto import CustomRoleRefDto


T = TypeVar("T", bound="CurrentApiKeyDto")


@_attrs_define
class CurrentApiKeyDto:
    """
    Attributes:
        api_key_id (UUID):
        workspace_id (UUID): The one workspace the key works in
        role (WorkspaceRole): Your role here
        custom_role (CustomRoleRefDto | None): The workspace’s own role, when `role` is CUSTOM
        permissions (list[WorkspacePermission]): What the key may do
    """

    api_key_id: UUID
    workspace_id: UUID
    role: WorkspaceRole
    custom_role: CustomRoleRefDto | None
    permissions: list[WorkspacePermission]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.custom_role_ref_dto import CustomRoleRefDto

        api_key_id = str(self.api_key_id)

        workspace_id = str(self.workspace_id)

        role = self.role.value

        custom_role: dict[str, Any] | None
        if isinstance(self.custom_role, CustomRoleRefDto):
            custom_role = self.custom_role.to_dict()
        else:
            custom_role = self.custom_role

        permissions = []
        for permissions_item_data in self.permissions:
            permissions_item = permissions_item_data.value
            permissions.append(permissions_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "apiKeyId": api_key_id,
                "workspaceId": workspace_id,
                "role": role,
                "customRole": custom_role,
                "permissions": permissions,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.custom_role_ref_dto import CustomRoleRefDto

        d = dict(src_dict)
        api_key_id = UUID(d.pop("apiKeyId"))

        workspace_id = UUID(d.pop("workspaceId"))

        role = WorkspaceRole(d.pop("role"))

        def _parse_custom_role(data: object) -> CustomRoleRefDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                custom_role_type_0 = CustomRoleRefDto.from_dict(data)

                return custom_role_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(CustomRoleRefDto | None, data)

        custom_role = _parse_custom_role(d.pop("customRole"))

        permissions = []
        _permissions = d.pop("permissions")
        for permissions_item_data in _permissions:
            permissions_item = WorkspacePermission(permissions_item_data)

            permissions.append(permissions_item)

        current_api_key_dto = cls(
            api_key_id=api_key_id,
            workspace_id=workspace_id,
            role=role,
            custom_role=custom_role,
            permissions=permissions,
        )

        current_api_key_dto.additional_properties = d
        return current_api_key_dto

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

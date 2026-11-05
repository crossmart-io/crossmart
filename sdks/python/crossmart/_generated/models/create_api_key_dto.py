from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.workspace_role import WorkspaceRole
from ..types import UNSET, Unset

T = TypeVar("T", bound="CreateApiKeyDto")


@_attrs_define
class CreateApiKeyDto:
    """
    Attributes:
        role (WorkspaceRole): Your role here
        name (str):  Example: Claude Desktop.
        custom_role_id (UUID | Unset): One of the workspace’s roles, with CUSTOM
        expires_at (datetime.datetime | Unset): Leave empty for a key that does not expire
    """

    role: WorkspaceRole
    name: str
    custom_role_id: UUID | Unset = UNSET
    expires_at: datetime.datetime | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        role = self.role.value

        name = self.name

        custom_role_id: str | Unset = UNSET
        if not isinstance(self.custom_role_id, Unset):
            custom_role_id = str(self.custom_role_id)

        expires_at: str | Unset = UNSET
        if not isinstance(self.expires_at, Unset):
            expires_at = self.expires_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "role": role,
                "name": name,
            }
        )
        if custom_role_id is not UNSET:
            field_dict["customRoleId"] = custom_role_id
        if expires_at is not UNSET:
            field_dict["expiresAt"] = expires_at

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        role = WorkspaceRole(d.pop("role"))

        name = d.pop("name")

        _custom_role_id = d.pop("customRoleId", UNSET)
        custom_role_id: UUID | Unset
        if isinstance(_custom_role_id, Unset):
            custom_role_id = UNSET
        else:
            custom_role_id = UUID(_custom_role_id)

        _expires_at = d.pop("expiresAt", UNSET)
        expires_at: datetime.datetime | Unset
        if isinstance(_expires_at, Unset):
            expires_at = UNSET
        else:
            expires_at = datetime.datetime.fromisoformat(_expires_at)

        create_api_key_dto = cls(
            role=role,
            name=name,
            custom_role_id=custom_role_id,
            expires_at=expires_at,
        )

        create_api_key_dto.additional_properties = d
        return create_api_key_dto

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

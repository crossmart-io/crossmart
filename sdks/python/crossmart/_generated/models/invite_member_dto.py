from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.workspace_role import WorkspaceRole
from ..types import UNSET, Unset

T = TypeVar("T", bound="InviteMemberDto")


@_attrs_define
class InviteMemberDto:
    """
    Attributes:
        role (WorkspaceRole): Your role here
        email (str):  Example: dana@example.com.
        custom_role_id (UUID | Unset): One of the workspace’s roles, with CUSTOM
    """

    role: WorkspaceRole
    email: str
    custom_role_id: UUID | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        role = self.role.value

        email = self.email

        custom_role_id: str | Unset = UNSET
        if not isinstance(self.custom_role_id, Unset):
            custom_role_id = str(self.custom_role_id)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "role": role,
                "email": email,
            }
        )
        if custom_role_id is not UNSET:
            field_dict["customRoleId"] = custom_role_id

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        role = WorkspaceRole(d.pop("role"))

        email = d.pop("email")

        _custom_role_id = d.pop("customRoleId", UNSET)
        custom_role_id: UUID | Unset
        if isinstance(_custom_role_id, Unset):
            custom_role_id = UNSET
        else:
            custom_role_id = UUID(_custom_role_id)

        invite_member_dto = cls(
            role=role,
            email=email,
            custom_role_id=custom_role_id,
        )

        invite_member_dto.additional_properties = d
        return invite_member_dto

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

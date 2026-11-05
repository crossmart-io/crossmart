from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.workspace_role import WorkspaceRole

T = TypeVar("T", bound="InvitationPreviewDto")


@_attrs_define
class InvitationPreviewDto:
    """
    Attributes:
        workspace_name (str): The workspace's display name
        inviter_name (str):
        email (str): The address invited; accepting needs an account with it
        role (WorkspaceRole): Your role here
        role_name (str): The role as people read it Example: Editor.
        expires_at (datetime.datetime):
    """

    workspace_name: str
    inviter_name: str
    email: str
    role: WorkspaceRole
    role_name: str
    expires_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        workspace_name = self.workspace_name

        inviter_name = self.inviter_name

        email = self.email

        role = self.role.value

        role_name = self.role_name

        expires_at = self.expires_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "workspaceName": workspace_name,
                "inviterName": inviter_name,
                "email": email,
                "role": role,
                "roleName": role_name,
                "expiresAt": expires_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        workspace_name = d.pop("workspaceName")

        inviter_name = d.pop("inviterName")

        email = d.pop("email")

        role = WorkspaceRole(d.pop("role"))

        role_name = d.pop("roleName")

        expires_at = datetime.datetime.fromisoformat(d.pop("expiresAt"))

        invitation_preview_dto = cls(
            workspace_name=workspace_name,
            inviter_name=inviter_name,
            email=email,
            role=role,
            role_name=role_name,
            expires_at=expires_at,
        )

        invitation_preview_dto.additional_properties = d
        return invitation_preview_dto

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

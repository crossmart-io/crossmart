from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.workspace_role import WorkspaceRole

if TYPE_CHECKING:
    from ..models.custom_role_ref_dto import CustomRoleRefDto


T = TypeVar("T", bound="InvitationDto")


@_attrs_define
class InvitationDto:
    """
    Attributes:
        id (UUID):
        email (str):
        role (WorkspaceRole): Your role here
        custom_role (CustomRoleRefDto | None): The workspace’s own role, when `role` is CUSTOM
        invited_by_name (str):
        expires_at (datetime.datetime):
        created_at (datetime.datetime):
    """

    id: UUID
    email: str
    role: WorkspaceRole
    custom_role: CustomRoleRefDto | None
    invited_by_name: str
    expires_at: datetime.datetime
    created_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.custom_role_ref_dto import CustomRoleRefDto

        id = str(self.id)

        email = self.email

        role = self.role.value

        custom_role: dict[str, Any] | None
        if isinstance(self.custom_role, CustomRoleRefDto):
            custom_role = self.custom_role.to_dict()
        else:
            custom_role = self.custom_role

        invited_by_name = self.invited_by_name

        expires_at = self.expires_at.isoformat()

        created_at = self.created_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "email": email,
                "role": role,
                "customRole": custom_role,
                "invitedByName": invited_by_name,
                "expiresAt": expires_at,
                "createdAt": created_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.custom_role_ref_dto import CustomRoleRefDto

        d = dict(src_dict)
        id = UUID(d.pop("id"))

        email = d.pop("email")

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

        invited_by_name = d.pop("invitedByName")

        expires_at = datetime.datetime.fromisoformat(d.pop("expiresAt"))

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        invitation_dto = cls(
            id=id,
            email=email,
            role=role,
            custom_role=custom_role,
            invited_by_name=invited_by_name,
            expires_at=expires_at,
            created_at=created_at,
        )

        invitation_dto.additional_properties = d
        return invitation_dto

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

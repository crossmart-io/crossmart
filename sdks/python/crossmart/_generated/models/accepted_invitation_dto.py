from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.workspace_role import WorkspaceRole

T = TypeVar("T", bound="AcceptedInvitationDto")


@_attrs_define
class AcceptedInvitationDto:
    """
    Attributes:
        workspace_id (UUID):
        role (WorkspaceRole): Your role here
    """

    workspace_id: UUID
    role: WorkspaceRole
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        workspace_id = str(self.workspace_id)

        role = self.role.value

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "workspaceId": workspace_id,
                "role": role,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        workspace_id = UUID(d.pop("workspaceId"))

        role = WorkspaceRole(d.pop("role"))

        accepted_invitation_dto = cls(
            workspace_id=workspace_id,
            role=role,
        )

        accepted_invitation_dto.additional_properties = d
        return accepted_invitation_dto

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

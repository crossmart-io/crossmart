from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.outside_agent_changes import OutsideAgentChanges
from ..models.workspace_permission import WorkspacePermission
from ..models.workspace_role import WorkspaceRole

if TYPE_CHECKING:
    from ..models.custom_role_ref_dto import CustomRoleRefDto
    from ..models.sandbox_state_dto import SandboxStateDto


T = TypeVar("T", bound="WorkspaceDto")


@_attrs_define
class WorkspaceDto:
    """
    Attributes:
        id (UUID):
        organization_id (UUID):
        name (str):
        display_name (str): The name to show: the organization name while the workspace is named Default
        slug (str):
        currency (str): ISO 4217 code of the catalog prices Example: USD.
        time_zone (None | str): IANA time zone that reports follow; null until set Example: Asia/Jerusalem.
        sandbox (None | SandboxStateDto): Set while the workspace is an unclaimed sandbox account an AI agent opened: it
            cannot connect stores, publish or invite people until claimed. Null for every other workspace.
        outside_agent_changes (OutsideAgentChanges): What happens to changes by outside AI agents (OAuth agents and MCP
            sessions): `require_approval` (the default) makes each one a proposal to approve; `apply_directly` makes them at
            once. API keys over REST always apply directly.
        role (WorkspaceRole): Your role here
        custom_role (CustomRoleRefDto | None): The workspace’s own role, when `role` is CUSTOM
        permissions (list[WorkspacePermission]): What your role lets you do here. Check these, not the role, to adapt a
            UI.
    """

    id: UUID
    organization_id: UUID
    name: str
    display_name: str
    slug: str
    currency: str
    time_zone: None | str
    sandbox: None | SandboxStateDto
    outside_agent_changes: OutsideAgentChanges
    role: WorkspaceRole
    custom_role: CustomRoleRefDto | None
    permissions: list[WorkspacePermission]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.custom_role_ref_dto import CustomRoleRefDto
        from ..models.sandbox_state_dto import SandboxStateDto

        id = str(self.id)

        organization_id = str(self.organization_id)

        name = self.name

        display_name = self.display_name

        slug = self.slug

        currency = self.currency

        time_zone: None | str
        time_zone = self.time_zone

        sandbox: dict[str, Any] | None
        if isinstance(self.sandbox, SandboxStateDto):
            sandbox = self.sandbox.to_dict()
        else:
            sandbox = self.sandbox

        outside_agent_changes = self.outside_agent_changes.value

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
                "id": id,
                "organizationId": organization_id,
                "name": name,
                "displayName": display_name,
                "slug": slug,
                "currency": currency,
                "timeZone": time_zone,
                "sandbox": sandbox,
                "outsideAgentChanges": outside_agent_changes,
                "role": role,
                "customRole": custom_role,
                "permissions": permissions,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.custom_role_ref_dto import CustomRoleRefDto
        from ..models.sandbox_state_dto import SandboxStateDto

        d = dict(src_dict)
        id = UUID(d.pop("id"))

        organization_id = UUID(d.pop("organizationId"))

        name = d.pop("name")

        display_name = d.pop("displayName")

        slug = d.pop("slug")

        currency = d.pop("currency")

        def _parse_time_zone(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        time_zone = _parse_time_zone(d.pop("timeZone"))

        def _parse_sandbox(data: object) -> None | SandboxStateDto:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                sandbox_type_0 = SandboxStateDto.from_dict(data)

                return sandbox_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | SandboxStateDto, data)

        sandbox = _parse_sandbox(d.pop("sandbox"))

        outside_agent_changes = OutsideAgentChanges(d.pop("outsideAgentChanges"))

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

        workspace_dto = cls(
            id=id,
            organization_id=organization_id,
            name=name,
            display_name=display_name,
            slug=slug,
            currency=currency,
            time_zone=time_zone,
            sandbox=sandbox,
            outside_agent_changes=outside_agent_changes,
            role=role,
            custom_role=custom_role,
            permissions=permissions,
        )

        workspace_dto.additional_properties = d
        return workspace_dto

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

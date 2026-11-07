from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="SandboxClaimPreviewDto")


@_attrs_define
class SandboxClaimPreviewDto:
    """
    Attributes:
        workspace_id (UUID):
        email (str): The address the account is for; the person signs in with it
        store_name (str):
        claim_expires_at (datetime.datetime): When the link stops working and the account is deleted
        password_set (bool): True when the person already has a password: they sign in and claim from the app instead of
            choosing one
    """

    workspace_id: UUID
    email: str
    store_name: str
    claim_expires_at: datetime.datetime
    password_set: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        workspace_id = str(self.workspace_id)

        email = self.email

        store_name = self.store_name

        claim_expires_at = self.claim_expires_at.isoformat()

        password_set = self.password_set

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "workspaceId": workspace_id,
                "email": email,
                "storeName": store_name,
                "claimExpiresAt": claim_expires_at,
                "passwordSet": password_set,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        workspace_id = UUID(d.pop("workspaceId"))

        email = d.pop("email")

        store_name = d.pop("storeName")

        claim_expires_at = datetime.datetime.fromisoformat(d.pop("claimExpiresAt"))

        password_set = d.pop("passwordSet")

        sandbox_claim_preview_dto = cls(
            workspace_id=workspace_id,
            email=email,
            store_name=store_name,
            claim_expires_at=claim_expires_at,
            password_set=password_set,
        )

        sandbox_claim_preview_dto.additional_properties = d
        return sandbox_claim_preview_dto

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

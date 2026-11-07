from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.sandbox_opening_outcome import SandboxOpeningOutcome

T = TypeVar("T", bound="SandboxAccountDto")


@_attrs_define
class SandboxAccountDto:
    """
    Attributes:
        outcome (SandboxOpeningOutcome):
        next_step (str): What the agent should do next
        workspace_id (None | UUID):
        api_key (None | str): An Editor API key for the new workspace, shown only now. Send it as `Authorization: Bearer
            <key>` or `x-api-key`.
        claim_expires_at (datetime.datetime | None): When the claim link stops working and the unclaimed account is
            deleted
    """

    outcome: SandboxOpeningOutcome
    next_step: str
    workspace_id: None | UUID
    api_key: None | str
    claim_expires_at: datetime.datetime | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        outcome = self.outcome.value

        next_step = self.next_step

        workspace_id: None | str
        if isinstance(self.workspace_id, UUID):
            workspace_id = str(self.workspace_id)
        else:
            workspace_id = self.workspace_id

        api_key: None | str
        api_key = self.api_key

        claim_expires_at: None | str
        if isinstance(self.claim_expires_at, datetime.datetime):
            claim_expires_at = self.claim_expires_at.isoformat()
        else:
            claim_expires_at = self.claim_expires_at

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "outcome": outcome,
                "nextStep": next_step,
                "workspaceId": workspace_id,
                "apiKey": api_key,
                "claimExpiresAt": claim_expires_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        outcome = SandboxOpeningOutcome(d.pop("outcome"))

        next_step = d.pop("nextStep")

        def _parse_workspace_id(data: object) -> None | UUID:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                workspace_id_type_0 = UUID(data)

                return workspace_id_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UUID, data)

        workspace_id = _parse_workspace_id(d.pop("workspaceId"))

        def _parse_api_key(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        api_key = _parse_api_key(d.pop("apiKey"))

        def _parse_claim_expires_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                claim_expires_at_type_0 = datetime.datetime.fromisoformat(data)

                return claim_expires_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        claim_expires_at = _parse_claim_expires_at(d.pop("claimExpiresAt"))

        sandbox_account_dto = cls(
            outcome=outcome,
            next_step=next_step,
            workspace_id=workspace_id,
            api_key=api_key,
            claim_expires_at=claim_expires_at,
        )

        sandbox_account_dto.additional_properties = d
        return sandbox_account_dto

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

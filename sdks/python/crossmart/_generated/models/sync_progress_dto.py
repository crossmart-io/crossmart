from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="SyncProgressDto")


@_attrs_define
class SyncProgressDto:
    """
    Attributes:
        pending (float): Listings whose publish, update or delist a sync or retry queued and whose job has not finished
            yet (each shows `syncRequestedAt`, and `displayState: publishing` while selected)
        failed (float): The store’s listings in error now, whatever queued them
        done (bool): True once nothing a sync or retry queued is still pending
    """

    pending: float
    failed: float
    done: bool
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        pending = self.pending

        failed = self.failed

        done = self.done

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "pending": pending,
                "failed": failed,
                "done": done,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        pending = d.pop("pending")

        failed = d.pop("failed")

        done = d.pop("done")

        sync_progress_dto = cls(
            pending=pending,
            failed=failed,
            done=done,
        )

        sync_progress_dto.additional_properties = d
        return sync_progress_dto

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

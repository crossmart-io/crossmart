from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="ImportJobCountsDto")


@_attrs_define
class ImportJobCountsDto:
    """
    Attributes:
        created (float):
        linked (float): Channel products linked to catalog products they matched; zero for file imports
        updated (float): Products replaced by an update import, variants whose stock an inventory import set, or
            products a channel import found already linked
        skipped (float):
        failed (float):
    """

    created: float
    linked: float
    updated: float
    skipped: float
    failed: float
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        created = self.created

        linked = self.linked

        updated = self.updated

        skipped = self.skipped

        failed = self.failed

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "created": created,
                "linked": linked,
                "updated": updated,
                "skipped": skipped,
                "failed": failed,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        created = d.pop("created")

        linked = d.pop("linked")

        updated = d.pop("updated")

        skipped = d.pop("skipped")

        failed = d.pop("failed")

        import_job_counts_dto = cls(
            created=created,
            linked=linked,
            updated=updated,
            skipped=skipped,
            failed=failed,
        )

        import_job_counts_dto.additional_properties = d
        return import_job_counts_dto

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

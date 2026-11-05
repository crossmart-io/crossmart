from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.import_issue_code import ImportIssueCode
from ..models.import_issue_outcome import ImportIssueOutcome
from ..types import UNSET, Unset

T = TypeVar("T", bound="ImportJobIssueDto")


@_attrs_define
class ImportJobIssueDto:
    """
    Attributes:
        code (ImportIssueCode):
        message (str):
        outcome (ImportIssueOutcome):
        handle (str | Unset):
        sku (str | Unset):
        row (float | Unset): Spreadsheet row number; the header is row 1
    """

    code: ImportIssueCode
    message: str
    outcome: ImportIssueOutcome
    handle: str | Unset = UNSET
    sku: str | Unset = UNSET
    row: float | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        code = self.code.value

        message = self.message

        outcome = self.outcome.value

        handle = self.handle

        sku = self.sku

        row = self.row

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "code": code,
                "message": message,
                "outcome": outcome,
            }
        )
        if handle is not UNSET:
            field_dict["handle"] = handle
        if sku is not UNSET:
            field_dict["sku"] = sku
        if row is not UNSET:
            field_dict["row"] = row

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        code = ImportIssueCode(d.pop("code"))

        message = d.pop("message")

        outcome = ImportIssueOutcome(d.pop("outcome"))

        handle = d.pop("handle", UNSET)

        sku = d.pop("sku", UNSET)

        row = d.pop("row", UNSET)

        import_job_issue_dto = cls(
            code=code,
            message=message,
            outcome=outcome,
            handle=handle,
            sku=sku,
            row=row,
        )

        import_job_issue_dto.additional_properties = d
        return import_job_issue_dto

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

from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.catalog_import_format import CatalogImportFormat
from ..models.catalog_import_mode import CatalogImportMode
from ..models.import_job_status import ImportJobStatus

if TYPE_CHECKING:
    from ..models.import_job_actor_dto import ImportJobActorDto
    from ..models.import_job_counts_dto import ImportJobCountsDto
    from ..models.import_job_issue_dto import ImportJobIssueDto


T = TypeVar("T", bound="ImportJobDetailDto")


@_attrs_define
class ImportJobDetailDto:
    """
    Attributes:
        id (UUID):
        mode (CatalogImportMode): `create` adds new products (Shopify CSV), `update` replaces products matched by handle
            (Shopify CSV) and `inventory` sets stock by SKU (inventory CSV)
        format_ (CatalogImportFormat):
        file_name (str): The file name, or the channel account a channel import read
        connection_id (None | UUID): The channel connection a channel import reads; null for file imports
        total_count (float | None): Records the source holds, when it reports them, to show progress
        status (ImportJobStatus):
        counts (ImportJobCountsDto):
        error_message (None | str): Why the whole file was rejected
        actor (ImportJobActorDto):
        created_at (datetime.datetime):
        finished_at (datetime.datetime | None):
        issues (list[ImportJobIssueDto]): Skipped and failed records, in file order
    """

    id: UUID
    mode: CatalogImportMode
    format_: CatalogImportFormat
    file_name: str
    connection_id: None | UUID
    total_count: float | None
    status: ImportJobStatus
    counts: ImportJobCountsDto
    error_message: None | str
    actor: ImportJobActorDto
    created_at: datetime.datetime
    finished_at: datetime.datetime | None
    issues: list[ImportJobIssueDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        mode = self.mode.value

        format_ = self.format_.value

        file_name = self.file_name

        connection_id: None | str
        if isinstance(self.connection_id, UUID):
            connection_id = str(self.connection_id)
        else:
            connection_id = self.connection_id

        total_count: float | None
        total_count = self.total_count

        status = self.status.value

        counts = self.counts.to_dict()

        error_message: None | str
        error_message = self.error_message

        actor = self.actor.to_dict()

        created_at = self.created_at.isoformat()

        finished_at: None | str
        if isinstance(self.finished_at, datetime.datetime):
            finished_at = self.finished_at.isoformat()
        else:
            finished_at = self.finished_at

        issues = []
        for issues_item_data in self.issues:
            issues_item = issues_item_data.to_dict()
            issues.append(issues_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "mode": mode,
                "format": format_,
                "fileName": file_name,
                "connectionId": connection_id,
                "totalCount": total_count,
                "status": status,
                "counts": counts,
                "errorMessage": error_message,
                "actor": actor,
                "createdAt": created_at,
                "finishedAt": finished_at,
                "issues": issues,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.import_job_actor_dto import ImportJobActorDto
        from ..models.import_job_counts_dto import ImportJobCountsDto
        from ..models.import_job_issue_dto import ImportJobIssueDto

        d = dict(src_dict)
        id = UUID(d.pop("id"))

        mode = CatalogImportMode(d.pop("mode"))

        format_ = CatalogImportFormat(d.pop("format"))

        file_name = d.pop("fileName")

        def _parse_connection_id(data: object) -> None | UUID:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                connection_id_type_0 = UUID(data)

                return connection_id_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UUID, data)

        connection_id = _parse_connection_id(d.pop("connectionId"))

        def _parse_total_count(data: object) -> float | None:
            if data is None:
                return data
            return cast(float | None, data)

        total_count = _parse_total_count(d.pop("totalCount"))

        status = ImportJobStatus(d.pop("status"))

        counts = ImportJobCountsDto.from_dict(d.pop("counts"))

        def _parse_error_message(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        error_message = _parse_error_message(d.pop("errorMessage"))

        actor = ImportJobActorDto.from_dict(d.pop("actor"))

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        def _parse_finished_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                finished_at_type_0 = datetime.datetime.fromisoformat(data)

                return finished_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        finished_at = _parse_finished_at(d.pop("finishedAt"))

        issues = []
        _issues = d.pop("issues")
        for issues_item_data in _issues:
            issues_item = ImportJobIssueDto.from_dict(issues_item_data)

            issues.append(issues_item)

        import_job_detail_dto = cls(
            id=id,
            mode=mode,
            format_=format_,
            file_name=file_name,
            connection_id=connection_id,
            total_count=total_count,
            status=status,
            counts=counts,
            error_message=error_message,
            actor=actor,
            created_at=created_at,
            finished_at=finished_at,
            issues=issues,
        )

        import_job_detail_dto.additional_properties = d
        return import_job_detail_dto

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

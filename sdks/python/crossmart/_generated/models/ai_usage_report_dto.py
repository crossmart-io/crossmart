from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.ai_usage_line_dto import AiUsageLineDto
    from ..models.ai_usage_totals_dto import AiUsageTotalsDto


T = TypeVar("T", bound="AiUsageReportDto")


@_attrs_define
class AiUsageReportDto:
    """
    Attributes:
        from_ (datetime.datetime):
        to (datetime.datetime):
        totals (AiUsageTotalsDto):
        lines (list[AiUsageLineDto]):
    """

    from_: datetime.datetime
    to: datetime.datetime
    totals: AiUsageTotalsDto
    lines: list[AiUsageLineDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from_ = self.from_.isoformat()

        to = self.to.isoformat()

        totals = self.totals.to_dict()

        lines = []
        for lines_item_data in self.lines:
            lines_item = lines_item_data.to_dict()
            lines.append(lines_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "from": from_,
                "to": to,
                "totals": totals,
                "lines": lines,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.ai_usage_line_dto import AiUsageLineDto
        from ..models.ai_usage_totals_dto import AiUsageTotalsDto

        d = dict(src_dict)
        from_ = datetime.datetime.fromisoformat(d.pop("from"))

        to = datetime.datetime.fromisoformat(d.pop("to"))

        totals = AiUsageTotalsDto.from_dict(d.pop("totals"))

        lines = []
        _lines = d.pop("lines")
        for lines_item_data in _lines:
            lines_item = AiUsageLineDto.from_dict(lines_item_data)

            lines.append(lines_item)

        ai_usage_report_dto = cls(
            from_=from_,
            to=to,
            totals=totals,
            lines=lines,
        )

        ai_usage_report_dto.additional_properties = d
        return ai_usage_report_dto

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

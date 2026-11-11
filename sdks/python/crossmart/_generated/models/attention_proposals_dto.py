from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.attention_proposal_dto import AttentionProposalDto


T = TypeVar("T", bound="AttentionProposalsDto")


@_attrs_define
class AttentionProposalsDto:
    """
    Attributes:
        count (float): Outside agents’ changes waiting for approval
        items (list[AttentionProposalDto]): The latest ones, up to `limit`
    """

    count: float
    items: list[AttentionProposalDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        count = self.count

        items = []
        for items_item_data in self.items:
            items_item = items_item_data.to_dict()
            items.append(items_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "count": count,
                "items": items,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.attention_proposal_dto import AttentionProposalDto

        d = dict(src_dict)
        count = d.pop("count")

        items = []
        _items = d.pop("items")
        for items_item_data in _items:
            items_item = AttentionProposalDto.from_dict(items_item_data)

            items.append(items_item)

        attention_proposals_dto = cls(
            count=count,
            items=items,
        )

        attention_proposals_dto.additional_properties = d
        return attention_proposals_dto

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

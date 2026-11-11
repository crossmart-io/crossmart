from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.attention_listings_dto import AttentionListingsDto
    from ..models.attention_proposals_dto import AttentionProposalsDto
    from ..models.attention_stores_dto import AttentionStoresDto
    from ..models.attention_suggestions_dto import AttentionSuggestionsDto


T = TypeVar("T", bound="AttentionSummaryDto")


@_attrs_define
class AttentionSummaryDto:
    """
    Attributes:
        total (float): The sum of the visible sections’ counts, for one badge
        stores (AttentionStoresDto | None):
        listings (AttentionListingsDto | None):
        proposals (AttentionProposalsDto | None):
        suggestions (AttentionSuggestionsDto | None):
    """

    total: float
    stores: AttentionStoresDto | None
    listings: AttentionListingsDto | None
    proposals: AttentionProposalsDto | None
    suggestions: AttentionSuggestionsDto | None
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.attention_listings_dto import AttentionListingsDto
        from ..models.attention_proposals_dto import AttentionProposalsDto
        from ..models.attention_stores_dto import AttentionStoresDto
        from ..models.attention_suggestions_dto import AttentionSuggestionsDto

        total = self.total

        stores: dict[str, Any] | None
        if isinstance(self.stores, AttentionStoresDto):
            stores = self.stores.to_dict()
        else:
            stores = self.stores

        listings: dict[str, Any] | None
        if isinstance(self.listings, AttentionListingsDto):
            listings = self.listings.to_dict()
        else:
            listings = self.listings

        proposals: dict[str, Any] | None
        if isinstance(self.proposals, AttentionProposalsDto):
            proposals = self.proposals.to_dict()
        else:
            proposals = self.proposals

        suggestions: dict[str, Any] | None
        if isinstance(self.suggestions, AttentionSuggestionsDto):
            suggestions = self.suggestions.to_dict()
        else:
            suggestions = self.suggestions

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "total": total,
                "stores": stores,
                "listings": listings,
                "proposals": proposals,
                "suggestions": suggestions,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.attention_listings_dto import AttentionListingsDto
        from ..models.attention_proposals_dto import AttentionProposalsDto
        from ..models.attention_stores_dto import AttentionStoresDto
        from ..models.attention_suggestions_dto import AttentionSuggestionsDto

        d = dict(src_dict)
        total = d.pop("total")

        def _parse_stores(data: object) -> AttentionStoresDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                stores_type_0 = AttentionStoresDto.from_dict(data)

                return stores_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(AttentionStoresDto | None, data)

        stores = _parse_stores(d.pop("stores"))

        def _parse_listings(data: object) -> AttentionListingsDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                listings_type_0 = AttentionListingsDto.from_dict(data)

                return listings_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(AttentionListingsDto | None, data)

        listings = _parse_listings(d.pop("listings"))

        def _parse_proposals(data: object) -> AttentionProposalsDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                proposals_type_0 = AttentionProposalsDto.from_dict(data)

                return proposals_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(AttentionProposalsDto | None, data)

        proposals = _parse_proposals(d.pop("proposals"))

        def _parse_suggestions(data: object) -> AttentionSuggestionsDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                suggestions_type_0 = AttentionSuggestionsDto.from_dict(data)

                return suggestions_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(AttentionSuggestionsDto | None, data)

        suggestions = _parse_suggestions(d.pop("suggestions"))

        attention_summary_dto = cls(
            total=total,
            stores=stores,
            listings=listings,
            proposals=proposals,
            suggestions=suggestions,
        )

        attention_summary_dto.additional_properties = d
        return attention_summary_dto

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

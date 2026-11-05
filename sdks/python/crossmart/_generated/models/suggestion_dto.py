from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.suggestion_kind import SuggestionKind
from ..models.suggestion_status import SuggestionStatus

if TYPE_CHECKING:
    from ..models.suggestion_connection_dto import SuggestionConnectionDto
    from ..models.suggestion_creator_dto import SuggestionCreatorDto
    from ..models.suggestion_review_dto import SuggestionReviewDto


T = TypeVar("T", bound="SuggestionDto")


@_attrs_define
class SuggestionDto:
    """
    Attributes:
        id (UUID):
        product_id (UUID):
        product_title (str):  Example: Stoneware Mug.
        image_url (None | str):
        connection (None | SuggestionConnectionDto): The store the change is for; null for the product’s own content
        kind (SuggestionKind):
        status (SuggestionStatus):
        current_value (str): The value it replaces, as it was when it was made
        proposed_value (str):
        rationale (str): Why the agent proposes it
        created_by (SuggestionCreatorDto):
        review (None | SuggestionReviewDto):
        created_at (datetime.datetime):
        updated_at (datetime.datetime):
    """

    id: UUID
    product_id: UUID
    product_title: str
    image_url: None | str
    connection: None | SuggestionConnectionDto
    kind: SuggestionKind
    status: SuggestionStatus
    current_value: str
    proposed_value: str
    rationale: str
    created_by: SuggestionCreatorDto
    review: None | SuggestionReviewDto
    created_at: datetime.datetime
    updated_at: datetime.datetime
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.suggestion_connection_dto import SuggestionConnectionDto
        from ..models.suggestion_review_dto import SuggestionReviewDto

        id = str(self.id)

        product_id = str(self.product_id)

        product_title = self.product_title

        image_url: None | str
        image_url = self.image_url

        connection: dict[str, Any] | None
        if isinstance(self.connection, SuggestionConnectionDto):
            connection = self.connection.to_dict()
        else:
            connection = self.connection

        kind = self.kind.value

        status = self.status.value

        current_value = self.current_value

        proposed_value = self.proposed_value

        rationale = self.rationale

        created_by = self.created_by.to_dict()

        review: dict[str, Any] | None
        if isinstance(self.review, SuggestionReviewDto):
            review = self.review.to_dict()
        else:
            review = self.review

        created_at = self.created_at.isoformat()

        updated_at = self.updated_at.isoformat()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "productId": product_id,
                "productTitle": product_title,
                "imageUrl": image_url,
                "connection": connection,
                "kind": kind,
                "status": status,
                "currentValue": current_value,
                "proposedValue": proposed_value,
                "rationale": rationale,
                "createdBy": created_by,
                "review": review,
                "createdAt": created_at,
                "updatedAt": updated_at,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.suggestion_connection_dto import SuggestionConnectionDto
        from ..models.suggestion_creator_dto import SuggestionCreatorDto
        from ..models.suggestion_review_dto import SuggestionReviewDto

        d = dict(src_dict)
        id = UUID(d.pop("id"))

        product_id = UUID(d.pop("productId"))

        product_title = d.pop("productTitle")

        def _parse_image_url(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        image_url = _parse_image_url(d.pop("imageUrl"))

        def _parse_connection(data: object) -> None | SuggestionConnectionDto:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                connection_type_0 = SuggestionConnectionDto.from_dict(data)

                return connection_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | SuggestionConnectionDto, data)

        connection = _parse_connection(d.pop("connection"))

        kind = SuggestionKind(d.pop("kind"))

        status = SuggestionStatus(d.pop("status"))

        current_value = d.pop("currentValue")

        proposed_value = d.pop("proposedValue")

        rationale = d.pop("rationale")

        created_by = SuggestionCreatorDto.from_dict(d.pop("createdBy"))

        def _parse_review(data: object) -> None | SuggestionReviewDto:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                review_type_0 = SuggestionReviewDto.from_dict(data)

                return review_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | SuggestionReviewDto, data)

        review = _parse_review(d.pop("review"))

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        updated_at = datetime.datetime.fromisoformat(d.pop("updatedAt"))

        suggestion_dto = cls(
            id=id,
            product_id=product_id,
            product_title=product_title,
            image_url=image_url,
            connection=connection,
            kind=kind,
            status=status,
            current_value=current_value,
            proposed_value=proposed_value,
            rationale=rationale,
            created_by=created_by,
            review=review,
            created_at=created_at,
            updated_at=updated_at,
        )

        suggestion_dto.additional_properties = d
        return suggestion_dto

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

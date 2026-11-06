from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.product_selection_filter_dto import ProductSelectionFilterDto


T = TypeVar("T", bound="ProductSelectionRuleDto")


@_attrs_define
class ProductSelectionRuleDto:
    """
    Attributes:
        filter_ (None | ProductSelectionFilterDto):
        include_product_ids (list[UUID]):
        exclude_product_ids (list[UUID]):
    """

    filter_: None | ProductSelectionFilterDto
    include_product_ids: list[UUID]
    exclude_product_ids: list[UUID]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.product_selection_filter_dto import ProductSelectionFilterDto

        filter_: dict[str, Any] | None
        if isinstance(self.filter_, ProductSelectionFilterDto):
            filter_ = self.filter_.to_dict()
        else:
            filter_ = self.filter_

        include_product_ids = []
        for include_product_ids_item_data in self.include_product_ids:
            include_product_ids_item = str(include_product_ids_item_data)
            include_product_ids.append(include_product_ids_item)

        exclude_product_ids = []
        for exclude_product_ids_item_data in self.exclude_product_ids:
            exclude_product_ids_item = str(exclude_product_ids_item_data)
            exclude_product_ids.append(exclude_product_ids_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "filter": filter_,
                "includeProductIds": include_product_ids,
                "excludeProductIds": exclude_product_ids,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.product_selection_filter_dto import ProductSelectionFilterDto

        d = dict(src_dict)

        def _parse_filter_(data: object) -> None | ProductSelectionFilterDto:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                filter_type_0 = ProductSelectionFilterDto.from_dict(data)

                return filter_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | ProductSelectionFilterDto, data)

        filter_ = _parse_filter_(d.pop("filter"))

        include_product_ids = []
        _include_product_ids = d.pop("includeProductIds")
        for include_product_ids_item_data in _include_product_ids:
            include_product_ids_item = UUID(include_product_ids_item_data)

            include_product_ids.append(include_product_ids_item)

        exclude_product_ids = []
        _exclude_product_ids = d.pop("excludeProductIds")
        for exclude_product_ids_item_data in _exclude_product_ids:
            exclude_product_ids_item = UUID(exclude_product_ids_item_data)

            exclude_product_ids.append(exclude_product_ids_item)

        product_selection_rule_dto = cls(
            filter_=filter_,
            include_product_ids=include_product_ids,
            exclude_product_ids=exclude_product_ids,
        )

        product_selection_rule_dto.additional_properties = d
        return product_selection_rule_dto

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

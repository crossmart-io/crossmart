from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.bulk_product_action import BulkProductAction
from ..models.product_status import ProductStatus
from ..types import UNSET, Unset

T = TypeVar("T", bound="BulkProductActionDto")


@_attrs_define
class BulkProductActionDto:
    """
    Attributes:
        product_ids (list[UUID]):
        action (BulkProductAction):
        status (ProductStatus | Unset):
        tags (list[str] | Unset): Required for `add_tags` and `remove_tags`
        percent (float | Unset): Required for `adjust_prices`. 10 raises every price by 10%, -15 lowers it by 15%.
    """

    product_ids: list[UUID]
    action: BulkProductAction
    status: ProductStatus | Unset = UNSET
    tags: list[str] | Unset = UNSET
    percent: float | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        product_ids = []
        for product_ids_item_data in self.product_ids:
            product_ids_item = str(product_ids_item_data)
            product_ids.append(product_ids_item)

        action = self.action.value

        status: str | Unset = UNSET
        if not isinstance(self.status, Unset):
            status = self.status.value

        tags: list[str] | Unset = UNSET
        if not isinstance(self.tags, Unset):
            tags = self.tags

        percent = self.percent

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "productIds": product_ids,
                "action": action,
            }
        )
        if status is not UNSET:
            field_dict["status"] = status
        if tags is not UNSET:
            field_dict["tags"] = tags
        if percent is not UNSET:
            field_dict["percent"] = percent

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        product_ids = []
        _product_ids = d.pop("productIds")
        for product_ids_item_data in _product_ids:
            product_ids_item = UUID(product_ids_item_data)

            product_ids.append(product_ids_item)

        action = BulkProductAction(d.pop("action"))

        _status = d.pop("status", UNSET)
        status: ProductStatus | Unset
        if isinstance(_status, Unset):
            status = UNSET
        else:
            status = ProductStatus(_status)

        tags = cast(list[str], d.pop("tags", UNSET))

        percent = d.pop("percent", UNSET)

        bulk_product_action_dto = cls(
            product_ids=product_ids,
            action=action,
            status=status,
            tags=tags,
            percent=percent,
        )

        bulk_product_action_dto.additional_properties = d
        return bulk_product_action_dto

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

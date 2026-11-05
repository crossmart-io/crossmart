from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="OrderLineDto")


@_attrs_define
class OrderLineDto:
    """
    Attributes:
        id (UUID):
        title (str):
        sku (None | str):
        quantity (float):
        unit_price (str):  Example: 45.00.
        reserved_quantity (float): Units held for the order until they ship
        fulfilled_quantity (float): Units shipped
        variant_id (None | UUID):
        product_id (None | UUID):
    """

    id: UUID
    title: str
    sku: None | str
    quantity: float
    unit_price: str
    reserved_quantity: float
    fulfilled_quantity: float
    variant_id: None | UUID
    product_id: None | UUID
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        id = str(self.id)

        title = self.title

        sku: None | str
        sku = self.sku

        quantity = self.quantity

        unit_price = self.unit_price

        reserved_quantity = self.reserved_quantity

        fulfilled_quantity = self.fulfilled_quantity

        variant_id: None | str
        if isinstance(self.variant_id, UUID):
            variant_id = str(self.variant_id)
        else:
            variant_id = self.variant_id

        product_id: None | str
        if isinstance(self.product_id, UUID):
            product_id = str(self.product_id)
        else:
            product_id = self.product_id

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "title": title,
                "sku": sku,
                "quantity": quantity,
                "unitPrice": unit_price,
                "reservedQuantity": reserved_quantity,
                "fulfilledQuantity": fulfilled_quantity,
                "variantId": variant_id,
                "productId": product_id,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        id = UUID(d.pop("id"))

        title = d.pop("title")

        def _parse_sku(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        sku = _parse_sku(d.pop("sku"))

        quantity = d.pop("quantity")

        unit_price = d.pop("unitPrice")

        reserved_quantity = d.pop("reservedQuantity")

        fulfilled_quantity = d.pop("fulfilledQuantity")

        def _parse_variant_id(data: object) -> None | UUID:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                variant_id_type_0 = UUID(data)

                return variant_id_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UUID, data)

        variant_id = _parse_variant_id(d.pop("variantId"))

        def _parse_product_id(data: object) -> None | UUID:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                product_id_type_0 = UUID(data)

                return product_id_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UUID, data)

        product_id = _parse_product_id(d.pop("productId"))

        order_line_dto = cls(
            id=id,
            title=title,
            sku=sku,
            quantity=quantity,
            unit_price=unit_price,
            reserved_quantity=reserved_quantity,
            fulfilled_quantity=fulfilled_quantity,
            variant_id=variant_id,
            product_id=product_id,
        )

        order_line_dto.additional_properties = d
        return order_line_dto

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

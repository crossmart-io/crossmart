from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.google_target_country import GoogleTargetCountry

T = TypeVar("T", bound="GoogleListingSetupDto")


@_attrs_define
class GoogleListingSetupDto:
    """
    Attributes:
        country (GoogleTargetCountry):
        product_url_template (str):  Example: https://acme.example/products/{handle}.
        data_source_id (str): The Merchant Center API data source Crossmart publishes into
    """

    country: GoogleTargetCountry
    product_url_template: str
    data_source_id: str
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        country = self.country.value

        product_url_template = self.product_url_template

        data_source_id = self.data_source_id

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "country": country,
                "productUrlTemplate": product_url_template,
                "dataSourceId": data_source_id,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)
        country = GoogleTargetCountry(d.pop("country"))

        product_url_template = d.pop("productUrlTemplate")

        data_source_id = d.pop("dataSourceId")

        google_listing_setup_dto = cls(
            country=country,
            product_url_template=product_url_template,
            data_source_id=data_source_id,
        )

        google_listing_setup_dto.additional_properties = d
        return google_listing_setup_dto

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

from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.health_controller_check_v1_response_200_info_type_0_additional_property import (
        HealthControllerCheckV1Response200InfoType0AdditionalProperty,
    )


T = TypeVar("T", bound="HealthControllerCheckV1Response200InfoType0")


@_attrs_define
class HealthControllerCheckV1Response200InfoType0:
    """
    Example:
        {'database': {'status': 'up', 'responseTime': 12}}

    """

    additional_properties: dict[
        str, HealthControllerCheckV1Response200InfoType0AdditionalProperty
    ] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:

        field_dict: dict[str, Any] = {}
        for prop_name, prop in self.additional_properties.items():
            field_dict[prop_name] = prop.to_dict()

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.health_controller_check_v1_response_200_info_type_0_additional_property import (
            HealthControllerCheckV1Response200InfoType0AdditionalProperty,
        )

        d = dict(src_dict)
        health_controller_check_v1_response_200_info_type_0 = cls()

        additional_properties = {}
        for prop_name, prop_dict in d.items():
            additional_property = (
                HealthControllerCheckV1Response200InfoType0AdditionalProperty.from_dict(
                    prop_dict
                )
            )

            additional_properties[prop_name] = additional_property

        health_controller_check_v1_response_200_info_type_0.additional_properties = (
            additional_properties
        )
        return health_controller_check_v1_response_200_info_type_0

    @property
    def additional_keys(self) -> list[str]:
        return list(self.additional_properties.keys())

    def __getitem__(
        self, key: str
    ) -> HealthControllerCheckV1Response200InfoType0AdditionalProperty:
        return self.additional_properties[key]

    def __setitem__(
        self,
        key: str,
        value: HealthControllerCheckV1Response200InfoType0AdditionalProperty,
    ) -> None:
        self.additional_properties[key] = value

    def __delitem__(self, key: str) -> None:
        del self.additional_properties[key]

    def __contains__(self, key: str) -> bool:
        return key in self.additional_properties

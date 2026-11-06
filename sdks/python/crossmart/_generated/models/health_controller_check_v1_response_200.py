from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.health_controller_check_v1_response_200_status import (
    HealthControllerCheckV1Response200Status,
)
from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.health_controller_check_v1_response_200_details import (
        HealthControllerCheckV1Response200Details,
    )
    from ..models.health_controller_check_v1_response_200_error_type_0 import (
        HealthControllerCheckV1Response200ErrorType0,
    )
    from ..models.health_controller_check_v1_response_200_info_type_0 import (
        HealthControllerCheckV1Response200InfoType0,
    )


T = TypeVar("T", bound="HealthControllerCheckV1Response200")


@_attrs_define
class HealthControllerCheckV1Response200:
    """
    Attributes:
        status (HealthControllerCheckV1Response200Status | Unset):  Example: ok.
        info (HealthControllerCheckV1Response200InfoType0 | None | Unset):  Example: {'database': {'status': 'up',
            'responseTime': 12}}.
        error (HealthControllerCheckV1Response200ErrorType0 | None | Unset):  Example: {}.
        details (HealthControllerCheckV1Response200Details | Unset):  Example: {'database': {'status': 'up',
            'responseTime': 12}}.
    """

    status: HealthControllerCheckV1Response200Status | Unset = UNSET
    info: HealthControllerCheckV1Response200InfoType0 | None | Unset = UNSET
    error: HealthControllerCheckV1Response200ErrorType0 | None | Unset = UNSET
    details: HealthControllerCheckV1Response200Details | Unset = UNSET
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.health_controller_check_v1_response_200_error_type_0 import (
            HealthControllerCheckV1Response200ErrorType0,
        )
        from ..models.health_controller_check_v1_response_200_info_type_0 import (
            HealthControllerCheckV1Response200InfoType0,
        )

        status: str | Unset = UNSET
        if not isinstance(self.status, Unset):
            status = self.status.value

        info: dict[str, Any] | None | Unset
        if isinstance(self.info, Unset):
            info = UNSET
        elif isinstance(self.info, HealthControllerCheckV1Response200InfoType0):
            info = self.info.to_dict()
        else:
            info = self.info

        error: dict[str, Any] | None | Unset
        if isinstance(self.error, Unset):
            error = UNSET
        elif isinstance(self.error, HealthControllerCheckV1Response200ErrorType0):
            error = self.error.to_dict()
        else:
            error = self.error

        details: dict[str, Any] | Unset = UNSET
        if not isinstance(self.details, Unset):
            details = self.details.to_dict()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if status is not UNSET:
            field_dict["status"] = status
        if info is not UNSET:
            field_dict["info"] = info
        if error is not UNSET:
            field_dict["error"] = error
        if details is not UNSET:
            field_dict["details"] = details

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.health_controller_check_v1_response_200_details import (
            HealthControllerCheckV1Response200Details,
        )
        from ..models.health_controller_check_v1_response_200_error_type_0 import (
            HealthControllerCheckV1Response200ErrorType0,
        )
        from ..models.health_controller_check_v1_response_200_info_type_0 import (
            HealthControllerCheckV1Response200InfoType0,
        )

        d = dict(src_dict)
        _status = d.pop("status", UNSET)
        status: HealthControllerCheckV1Response200Status | Unset
        if isinstance(_status, Unset):
            status = UNSET
        else:
            status = HealthControllerCheckV1Response200Status(_status)

        def _parse_info(
            data: object,
        ) -> HealthControllerCheckV1Response200InfoType0 | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                info_type_0 = HealthControllerCheckV1Response200InfoType0.from_dict(
                    data
                )

                return info_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(
                HealthControllerCheckV1Response200InfoType0 | None | Unset, data
            )

        info = _parse_info(d.pop("info", UNSET))

        def _parse_error(
            data: object,
        ) -> HealthControllerCheckV1Response200ErrorType0 | None | Unset:
            if data is None:
                return data
            if isinstance(data, Unset):
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                error_type_0 = HealthControllerCheckV1Response200ErrorType0.from_dict(
                    data
                )

                return error_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(
                HealthControllerCheckV1Response200ErrorType0 | None | Unset, data
            )

        error = _parse_error(d.pop("error", UNSET))

        _details = d.pop("details", UNSET)
        details: HealthControllerCheckV1Response200Details | Unset
        if isinstance(_details, Unset):
            details = UNSET
        else:
            details = HealthControllerCheckV1Response200Details.from_dict(_details)

        health_controller_check_v1_response_200 = cls(
            status=status,
            info=info,
            error=error,
            details=details,
        )

        health_controller_check_v1_response_200.additional_properties = d
        return health_controller_check_v1_response_200

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

from __future__ import annotations

from collections.abc import Mapping
from typing import Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

T = TypeVar("T", bound="WorkspaceEventRefsDto")


@_attrs_define
class WorkspaceEventRefsDto:
    """
    Attributes:
        connection_id (None | UUID): The store (channel connection)
        product_id (None | UUID):
        order_id (None | UUID):
        webhook_endpoint_id (None | UUID):
        conversation_id (None | UUID): Your Crossmart Agent conversation
        action_id (None | UUID): The Crossmart Agent tool call
    """

    connection_id: None | UUID
    product_id: None | UUID
    order_id: None | UUID
    webhook_endpoint_id: None | UUID
    conversation_id: None | UUID
    action_id: None | UUID
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        connection_id: None | str
        if isinstance(self.connection_id, UUID):
            connection_id = str(self.connection_id)
        else:
            connection_id = self.connection_id

        product_id: None | str
        if isinstance(self.product_id, UUID):
            product_id = str(self.product_id)
        else:
            product_id = self.product_id

        order_id: None | str
        if isinstance(self.order_id, UUID):
            order_id = str(self.order_id)
        else:
            order_id = self.order_id

        webhook_endpoint_id: None | str
        if isinstance(self.webhook_endpoint_id, UUID):
            webhook_endpoint_id = str(self.webhook_endpoint_id)
        else:
            webhook_endpoint_id = self.webhook_endpoint_id

        conversation_id: None | str
        if isinstance(self.conversation_id, UUID):
            conversation_id = str(self.conversation_id)
        else:
            conversation_id = self.conversation_id

        action_id: None | str
        if isinstance(self.action_id, UUID):
            action_id = str(self.action_id)
        else:
            action_id = self.action_id

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "connectionId": connection_id,
                "productId": product_id,
                "orderId": order_id,
                "webhookEndpointId": webhook_endpoint_id,
                "conversationId": conversation_id,
                "actionId": action_id,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        d = dict(src_dict)

        def _parse_connection_id(data: object) -> None | UUID:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                connection_id_type_0 = UUID(data)

                return connection_id_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UUID, data)

        connection_id = _parse_connection_id(d.pop("connectionId"))

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

        def _parse_order_id(data: object) -> None | UUID:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                order_id_type_0 = UUID(data)

                return order_id_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UUID, data)

        order_id = _parse_order_id(d.pop("orderId"))

        def _parse_webhook_endpoint_id(data: object) -> None | UUID:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                webhook_endpoint_id_type_0 = UUID(data)

                return webhook_endpoint_id_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UUID, data)

        webhook_endpoint_id = _parse_webhook_endpoint_id(d.pop("webhookEndpointId"))

        def _parse_conversation_id(data: object) -> None | UUID:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                conversation_id_type_0 = UUID(data)

                return conversation_id_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UUID, data)

        conversation_id = _parse_conversation_id(d.pop("conversationId"))

        def _parse_action_id(data: object) -> None | UUID:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                action_id_type_0 = UUID(data)

                return action_id_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | UUID, data)

        action_id = _parse_action_id(d.pop("actionId"))

        workspace_event_refs_dto = cls(
            connection_id=connection_id,
            product_id=product_id,
            order_id=order_id,
            webhook_endpoint_id=webhook_endpoint_id,
            conversation_id=conversation_id,
            action_id=action_id,
        )

        workspace_event_refs_dto.additional_properties = d
        return workspace_event_refs_dto

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

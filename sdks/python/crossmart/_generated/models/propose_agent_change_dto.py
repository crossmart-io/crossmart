from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar

from attrs import define as _attrs_define
from attrs import field as _attrs_field

if TYPE_CHECKING:
    from ..models.propose_agent_change_dto_input import ProposeAgentChangeDtoInput


T = TypeVar("T", bound="ProposeAgentChangeDto")


@_attrs_define
class ProposeAgentChangeDto:
    """
    Attributes:
        tool (str): An MCP write tool, as the MCP server lists it Example: update_variant_price.
        input_ (ProposeAgentChangeDtoInput): The tool's input, as its MCP schema describes it Example: {'productId':
            '0193…', 'variantId': '0193…', 'price': '19.00'}.
    """

    tool: str
    input_: ProposeAgentChangeDtoInput
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        tool = self.tool

        input_ = self.input_.to_dict()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "tool": tool,
                "input": input_,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.propose_agent_change_dto_input import ProposeAgentChangeDtoInput

        d = dict(src_dict)
        tool = d.pop("tool")

        input_ = ProposeAgentChangeDtoInput.from_dict(d.pop("input"))

        propose_agent_change_dto = cls(
            tool=tool,
            input_=input_,
        )

        propose_agent_change_dto.additional_properties = d
        return propose_agent_change_dto

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

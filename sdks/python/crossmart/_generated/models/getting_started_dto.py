from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.getting_started_step import GettingStartedStep

if TYPE_CHECKING:
    from ..models.getting_started_step_dto import GettingStartedStepDto
    from ..models.store_connect_link_dto import StoreConnectLinkDto


T = TypeVar("T", bound="GettingStartedDto")


@_attrs_define
class GettingStartedDto:
    """
    Attributes:
        email_verified (bool): Whether the caller (or the key’s creator) confirmed their email
        unclaimed_sandbox (bool): An account an AI agent opened that nobody has claimed yet
        products (float):
        connected_stores (float): Stores that are not disconnected
        live_listings (float): Listings live on a store
        pending_proposals (float): Outside agents’ changes waiting for approval
        agent_changes_need_approval (bool): Whether outside agents’ changes wait for the seller’s approval
        next_step (GettingStartedStep | None): The first step still to take; null once every step is done
        steps (list[GettingStartedStepDto]): The steps that apply, in order
        connect_store_links (list[StoreConnectLinkDto]):
    """

    email_verified: bool
    unclaimed_sandbox: bool
    products: float
    connected_stores: float
    live_listings: float
    pending_proposals: float
    agent_changes_need_approval: bool
    next_step: GettingStartedStep | None
    steps: list[GettingStartedStepDto]
    connect_store_links: list[StoreConnectLinkDto]
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        email_verified = self.email_verified

        unclaimed_sandbox = self.unclaimed_sandbox

        products = self.products

        connected_stores = self.connected_stores

        live_listings = self.live_listings

        pending_proposals = self.pending_proposals

        agent_changes_need_approval = self.agent_changes_need_approval

        next_step: None | str
        if isinstance(self.next_step, GettingStartedStep):
            next_step = self.next_step.value
        else:
            next_step = self.next_step

        steps = []
        for steps_item_data in self.steps:
            steps_item = steps_item_data.to_dict()
            steps.append(steps_item)

        connect_store_links = []
        for connect_store_links_item_data in self.connect_store_links:
            connect_store_links_item = connect_store_links_item_data.to_dict()
            connect_store_links.append(connect_store_links_item)

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "emailVerified": email_verified,
                "unclaimedSandbox": unclaimed_sandbox,
                "products": products,
                "connectedStores": connected_stores,
                "liveListings": live_listings,
                "pendingProposals": pending_proposals,
                "agentChangesNeedApproval": agent_changes_need_approval,
                "nextStep": next_step,
                "steps": steps,
                "connectStoreLinks": connect_store_links,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.getting_started_step_dto import GettingStartedStepDto
        from ..models.store_connect_link_dto import StoreConnectLinkDto

        d = dict(src_dict)
        email_verified = d.pop("emailVerified")

        unclaimed_sandbox = d.pop("unclaimedSandbox")

        products = d.pop("products")

        connected_stores = d.pop("connectedStores")

        live_listings = d.pop("liveListings")

        pending_proposals = d.pop("pendingProposals")

        agent_changes_need_approval = d.pop("agentChangesNeedApproval")

        def _parse_next_step(data: object) -> GettingStartedStep | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                next_step_type_0 = GettingStartedStep(data)

                return next_step_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(GettingStartedStep | None, data)

        next_step = _parse_next_step(d.pop("nextStep"))

        steps = []
        _steps = d.pop("steps")
        for steps_item_data in _steps:
            steps_item = GettingStartedStepDto.from_dict(steps_item_data)

            steps.append(steps_item)

        connect_store_links = []
        _connect_store_links = d.pop("connectStoreLinks")
        for connect_store_links_item_data in _connect_store_links:
            connect_store_links_item = StoreConnectLinkDto.from_dict(
                connect_store_links_item_data
            )

            connect_store_links.append(connect_store_links_item)

        getting_started_dto = cls(
            email_verified=email_verified,
            unclaimed_sandbox=unclaimed_sandbox,
            products=products,
            connected_stores=connected_stores,
            live_listings=live_listings,
            pending_proposals=pending_proposals,
            agent_changes_need_approval=agent_changes_need_approval,
            next_step=next_step,
            steps=steps,
            connect_store_links=connect_store_links,
        )

        getting_started_dto.additional_properties = d
        return getting_started_dto

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

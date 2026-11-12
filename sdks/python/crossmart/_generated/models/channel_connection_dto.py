from __future__ import annotations

import datetime
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, Self, TypeVar, cast
from uuid import UUID

from attrs import define as _attrs_define
from attrs import field as _attrs_field

from ..models.channel_connection_status import ChannelConnectionStatus
from ..models.channel_feature import ChannelFeature
from ..models.channel_type import ChannelType

if TYPE_CHECKING:
    from ..models.ebay_settings_dto import EbaySettingsDto
    from ..models.etsy_settings_dto import EtsySettingsDto
    from ..models.google_merchant_settings_dto import GoogleMerchantSettingsDto
    from ..models.mercado_libre_settings_dto import MercadoLibreSettingsDto
    from ..models.pricing_rule_dto import PricingRuleDto
    from ..models.product_selection_rule_dto import ProductSelectionRuleDto
    from ..models.publish_readiness_dto import PublishReadinessDto
    from ..models.shopify_settings_dto import ShopifySettingsDto


T = TypeVar("T", bound="ChannelConnectionDto")


@_attrs_define
class ChannelConnectionDto:
    """
    Attributes:
        id (UUID):
        channel (ChannelType):
        external_account_id (str): The account on the channel Example: demo-store.myshopify.com.
        display_name (str):  Example: Demo Store.
        status (ChannelConnectionStatus):
        status_reason (None | str): Why it needs re-auth or failed
        granted_scopes (list[str]):
        missing_features (list[ChannelFeature]): What the connection cannot do until the merchant approves the app again
        shopify (None | ShopifySettingsDto): The store’s details, for Shopify connections
        ebay (EbaySettingsDto | None): The account’s details on its marketplace, for eBay connections
        google_merchant (GoogleMerchantSettingsDto | None): The Merchant Center account and its listing setup, for
            Google connections
        etsy (EtsySettingsDto | None): The Etsy shop, its profiles and its listing setup, for Etsy connections
        mercado_libre (MercadoLibreSettingsDto | None): The seller and their country site, for Mercado Libre connections
        product_selection (None | ProductSelectionRuleDto): Which products the connection lists; null lists every
            product
        pricing (None | PricingRuleDto): How the connection prices variants; null sends catalog prices
        connected_at (datetime.datetime):
        disconnected_at (datetime.datetime | None):
        last_synced_at (datetime.datetime | None):
        created_at (datetime.datetime):
        updated_at (datetime.datetime):
        failed_listings (float): Listings in this store whose last sync failed
        publish_readiness (PublishReadinessDto):
    """

    id: UUID
    channel: ChannelType
    external_account_id: str
    display_name: str
    status: ChannelConnectionStatus
    status_reason: None | str
    granted_scopes: list[str]
    missing_features: list[ChannelFeature]
    shopify: None | ShopifySettingsDto
    ebay: EbaySettingsDto | None
    google_merchant: GoogleMerchantSettingsDto | None
    etsy: EtsySettingsDto | None
    mercado_libre: MercadoLibreSettingsDto | None
    product_selection: None | ProductSelectionRuleDto
    pricing: None | PricingRuleDto
    connected_at: datetime.datetime
    disconnected_at: datetime.datetime | None
    last_synced_at: datetime.datetime | None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    failed_listings: float
    publish_readiness: PublishReadinessDto
    additional_properties: dict[str, Any] = _attrs_field(init=False, factory=dict)

    def to_dict(self) -> dict[str, Any]:
        from ..models.ebay_settings_dto import EbaySettingsDto
        from ..models.etsy_settings_dto import EtsySettingsDto
        from ..models.google_merchant_settings_dto import GoogleMerchantSettingsDto
        from ..models.mercado_libre_settings_dto import MercadoLibreSettingsDto
        from ..models.pricing_rule_dto import PricingRuleDto
        from ..models.product_selection_rule_dto import ProductSelectionRuleDto
        from ..models.shopify_settings_dto import ShopifySettingsDto

        id = str(self.id)

        channel = self.channel.value

        external_account_id = self.external_account_id

        display_name = self.display_name

        status = self.status.value

        status_reason: None | str
        status_reason = self.status_reason

        granted_scopes = self.granted_scopes

        missing_features = []
        for missing_features_item_data in self.missing_features:
            missing_features_item = missing_features_item_data.value
            missing_features.append(missing_features_item)

        shopify: dict[str, Any] | None
        if isinstance(self.shopify, ShopifySettingsDto):
            shopify = self.shopify.to_dict()
        else:
            shopify = self.shopify

        ebay: dict[str, Any] | None
        if isinstance(self.ebay, EbaySettingsDto):
            ebay = self.ebay.to_dict()
        else:
            ebay = self.ebay

        google_merchant: dict[str, Any] | None
        if isinstance(self.google_merchant, GoogleMerchantSettingsDto):
            google_merchant = self.google_merchant.to_dict()
        else:
            google_merchant = self.google_merchant

        etsy: dict[str, Any] | None
        if isinstance(self.etsy, EtsySettingsDto):
            etsy = self.etsy.to_dict()
        else:
            etsy = self.etsy

        mercado_libre: dict[str, Any] | None
        if isinstance(self.mercado_libre, MercadoLibreSettingsDto):
            mercado_libre = self.mercado_libre.to_dict()
        else:
            mercado_libre = self.mercado_libre

        product_selection: dict[str, Any] | None
        if isinstance(self.product_selection, ProductSelectionRuleDto):
            product_selection = self.product_selection.to_dict()
        else:
            product_selection = self.product_selection

        pricing: dict[str, Any] | None
        if isinstance(self.pricing, PricingRuleDto):
            pricing = self.pricing.to_dict()
        else:
            pricing = self.pricing

        connected_at = self.connected_at.isoformat()

        disconnected_at: None | str
        if isinstance(self.disconnected_at, datetime.datetime):
            disconnected_at = self.disconnected_at.isoformat()
        else:
            disconnected_at = self.disconnected_at

        last_synced_at: None | str
        if isinstance(self.last_synced_at, datetime.datetime):
            last_synced_at = self.last_synced_at.isoformat()
        else:
            last_synced_at = self.last_synced_at

        created_at = self.created_at.isoformat()

        updated_at = self.updated_at.isoformat()

        failed_listings = self.failed_listings

        publish_readiness = self.publish_readiness.to_dict()

        field_dict: dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "id": id,
                "channel": channel,
                "externalAccountId": external_account_id,
                "displayName": display_name,
                "status": status,
                "statusReason": status_reason,
                "grantedScopes": granted_scopes,
                "missingFeatures": missing_features,
                "shopify": shopify,
                "ebay": ebay,
                "googleMerchant": google_merchant,
                "etsy": etsy,
                "mercadoLibre": mercado_libre,
                "productSelection": product_selection,
                "pricing": pricing,
                "connectedAt": connected_at,
                "disconnectedAt": disconnected_at,
                "lastSyncedAt": last_synced_at,
                "createdAt": created_at,
                "updatedAt": updated_at,
                "failedListings": failed_listings,
                "publishReadiness": publish_readiness,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls, src_dict: Mapping[str, Any]) -> Self:
        from ..models.ebay_settings_dto import EbaySettingsDto
        from ..models.etsy_settings_dto import EtsySettingsDto
        from ..models.google_merchant_settings_dto import GoogleMerchantSettingsDto
        from ..models.mercado_libre_settings_dto import MercadoLibreSettingsDto
        from ..models.pricing_rule_dto import PricingRuleDto
        from ..models.product_selection_rule_dto import ProductSelectionRuleDto
        from ..models.publish_readiness_dto import PublishReadinessDto
        from ..models.shopify_settings_dto import ShopifySettingsDto

        d = dict(src_dict)
        id = UUID(d.pop("id"))

        channel = ChannelType(d.pop("channel"))

        external_account_id = d.pop("externalAccountId")

        display_name = d.pop("displayName")

        status = ChannelConnectionStatus(d.pop("status"))

        def _parse_status_reason(data: object) -> None | str:
            if data is None:
                return data
            return cast(None | str, data)

        status_reason = _parse_status_reason(d.pop("statusReason"))

        granted_scopes = cast(list[str], d.pop("grantedScopes"))

        missing_features = []
        _missing_features = d.pop("missingFeatures")
        for missing_features_item_data in _missing_features:
            missing_features_item = ChannelFeature(missing_features_item_data)

            missing_features.append(missing_features_item)

        def _parse_shopify(data: object) -> None | ShopifySettingsDto:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                shopify_type_0 = ShopifySettingsDto.from_dict(data)

                return shopify_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | ShopifySettingsDto, data)

        shopify = _parse_shopify(d.pop("shopify"))

        def _parse_ebay(data: object) -> EbaySettingsDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                ebay_type_0 = EbaySettingsDto.from_dict(data)

                return ebay_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(EbaySettingsDto | None, data)

        ebay = _parse_ebay(d.pop("ebay"))

        def _parse_google_merchant(data: object) -> GoogleMerchantSettingsDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                google_merchant_type_0 = GoogleMerchantSettingsDto.from_dict(data)

                return google_merchant_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(GoogleMerchantSettingsDto | None, data)

        google_merchant = _parse_google_merchant(d.pop("googleMerchant"))

        def _parse_etsy(data: object) -> EtsySettingsDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                etsy_type_0 = EtsySettingsDto.from_dict(data)

                return etsy_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(EtsySettingsDto | None, data)

        etsy = _parse_etsy(d.pop("etsy"))

        def _parse_mercado_libre(data: object) -> MercadoLibreSettingsDto | None:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                mercado_libre_type_0 = MercadoLibreSettingsDto.from_dict(data)

                return mercado_libre_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(MercadoLibreSettingsDto | None, data)

        mercado_libre = _parse_mercado_libre(d.pop("mercadoLibre"))

        def _parse_product_selection(data: object) -> None | ProductSelectionRuleDto:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                product_selection_type_0 = ProductSelectionRuleDto.from_dict(data)

                return product_selection_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | ProductSelectionRuleDto, data)

        product_selection = _parse_product_selection(d.pop("productSelection"))

        def _parse_pricing(data: object) -> None | PricingRuleDto:
            if data is None:
                return data
            try:
                if not isinstance(data, dict):
                    raise TypeError()
                pricing_type_0 = PricingRuleDto.from_dict(data)

                return pricing_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(None | PricingRuleDto, data)

        pricing = _parse_pricing(d.pop("pricing"))

        connected_at = datetime.datetime.fromisoformat(d.pop("connectedAt"))

        def _parse_disconnected_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                disconnected_at_type_0 = datetime.datetime.fromisoformat(data)

                return disconnected_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        disconnected_at = _parse_disconnected_at(d.pop("disconnectedAt"))

        def _parse_last_synced_at(data: object) -> datetime.datetime | None:
            if data is None:
                return data
            try:
                if not isinstance(data, str):
                    raise TypeError()
                last_synced_at_type_0 = datetime.datetime.fromisoformat(data)

                return last_synced_at_type_0
            except (TypeError, ValueError, AttributeError, KeyError):
                pass
            return cast(datetime.datetime | None, data)

        last_synced_at = _parse_last_synced_at(d.pop("lastSyncedAt"))

        created_at = datetime.datetime.fromisoformat(d.pop("createdAt"))

        updated_at = datetime.datetime.fromisoformat(d.pop("updatedAt"))

        failed_listings = d.pop("failedListings")

        publish_readiness = PublishReadinessDto.from_dict(d.pop("publishReadiness"))

        channel_connection_dto = cls(
            id=id,
            channel=channel,
            external_account_id=external_account_id,
            display_name=display_name,
            status=status,
            status_reason=status_reason,
            granted_scopes=granted_scopes,
            missing_features=missing_features,
            shopify=shopify,
            ebay=ebay,
            google_merchant=google_merchant,
            etsy=etsy,
            mercado_libre=mercado_libre,
            product_selection=product_selection,
            pricing=pricing,
            connected_at=connected_at,
            disconnected_at=disconnected_at,
            last_synced_at=last_synced_at,
            created_at=created_at,
            updated_at=updated_at,
            failed_listings=failed_listings,
            publish_readiness=publish_readiness,
        )

        channel_connection_dto.additional_properties = d
        return channel_connection_dto

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

<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum ChannelType: string
{
    case Shopify = 'shopify';
    case Ebay = 'ebay';
    case GoogleMerchant = 'google_merchant';
    case Etsy = 'etsy';
    case MercadoLibre = 'mercado_libre';
    case Amazon = 'amazon';
    case Walmart = 'walmart';
}

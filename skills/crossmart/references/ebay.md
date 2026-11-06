# eBay categories and item specifics

eBay files every listing under a category, and the category decides which **item specifics**
(aspects such as Brand, Color, Size) the listing must have.

## Choose a category

1. `suggest_store_categories` with `productId` and `connectionId` (the eBay store). It searches the
   product's title; pass `search` keywords for a better match.
2. Pick the best one with the seller when it isn't obvious.
3. `set_store_category` with `category: { id, name }` from the suggestion. `null` lets the next
   publish pick the best match.

## Fill item specifics

1. `get_item_specifics`: required aspects first, then recommended, then optional, with the values
   set now. It is empty until the listing has a category.
   - `mode: selection_only`: the value must be one of `values`.
   - `mode: free_text`: any text.
   - Only aspects marked `multiple` take more than one value.
2. Fill **every required** aspect from the product's data (title, description, options, vendor).
   Ask the seller for what you can't tell, such as a brand. Don't guess facts about the item.
3. `save_item_specifics` **replaces** all of the listing's specifics: send the ones you keep plus
   the new ones. An empty `values` list removes an aspect. It's marked destructive: show the
   final list and confirm.

A listing already on eBay, or one whose last publish failed, is sent again by itself after
`save_item_specifics`. Otherwise call `retry_store_listing`.

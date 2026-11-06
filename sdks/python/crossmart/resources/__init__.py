"""The API's resource groups, each in a synchronous and an asynchronous flavour."""

from .ai import AI, AsyncAI
from .inventory import AsyncInventory, Inventory
from .listings import AsyncListings, Listings
from .orders import AsyncOrders, Orders
from .products import AsyncProducts, Products
from .reports import AsyncReports, Reports
from .stores import AsyncStores, Stores
from .suggestions import AsyncSuggestions, Suggestions
from .workspaces import AsyncWorkspaces, Workspaces

__all__ = [
    "AI",
    "AsyncAI",
    "AsyncInventory",
    "AsyncListings",
    "AsyncOrders",
    "AsyncProducts",
    "AsyncReports",
    "AsyncStores",
    "AsyncSuggestions",
    "AsyncWorkspaces",
    "Inventory",
    "Listings",
    "Orders",
    "Products",
    "Reports",
    "Stores",
    "Suggestions",
    "Workspaces",
]

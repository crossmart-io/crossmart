"""The official Python SDK of Crossmart.

Crossmart is the open-source multichannel platform for sellers and their AI agents.

Example::

    from crossmart import Crossmart

    client = Crossmart()  # reads CROSSMART_API_KEY
    page = client.products.list(limit=10)
"""

from ._client import AsyncCrossmart, Crossmart
from ._options import CredentialKind
from ._retry import RetryPolicy
from ._version import __version__
from .errors import (
    AuthenticationError,
    BadRequestError,
    ConflictError,
    CrossmartAPIError,
    CrossmartConfigurationError,
    CrossmartConnectionError,
    CrossmartError,
    NotFoundError,
    PermissionDeniedError,
    PlanLimitError,
    RateLimitError,
    ServerError,
)
from .pagination import Page
from .webhooks import (
    WebhookEvent,
    WebhookEventType,
    WebhookHeader,
    WebhookSignatureError,
    WebhookSignatureFailure,
    verify_webhook_signature,
)

__all__ = [
    "AsyncCrossmart",
    "AuthenticationError",
    "BadRequestError",
    "ConflictError",
    "CredentialKind",
    "Crossmart",
    "CrossmartAPIError",
    "CrossmartConfigurationError",
    "CrossmartConnectionError",
    "CrossmartError",
    "NotFoundError",
    "Page",
    "PermissionDeniedError",
    "PlanLimitError",
    "RateLimitError",
    "RetryPolicy",
    "ServerError",
    "WebhookEvent",
    "WebhookEventType",
    "WebhookHeader",
    "WebhookSignatureError",
    "WebhookSignatureFailure",
    "__version__",
    "verify_webhook_signature",
]

from http import HTTPStatus
from typing import Any

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.billing_plan_catalog_dto import BillingPlanCatalogDto
from ...types import Response


def _get_kwargs() -> dict[str, Any]:

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/billing/plans",
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> BillingPlanCatalogDto | None:
    if response.status_code == 200:
        response_200 = BillingPlanCatalogDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[BillingPlanCatalogDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    *,
    client: AuthenticatedClient | Client,
) -> Response[BillingPlanCatalogDto]:
    """The plans on offer, with what each includes and costs

     Open to anyone. Prices come from the billing provider, monthly and annual; a plan with none
    (Enterprise, or every plan on a self-hosted instance) is not self-serve and is sold through
    `salesEmail`.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[BillingPlanCatalogDto]
    """

    kwargs = _get_kwargs()

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    *,
    client: AuthenticatedClient | Client,
) -> BillingPlanCatalogDto | None:
    """The plans on offer, with what each includes and costs

     Open to anyone. Prices come from the billing provider, monthly and annual; a plan with none
    (Enterprise, or every plan on a self-hosted instance) is not self-serve and is sold through
    `salesEmail`.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        BillingPlanCatalogDto
    """

    return sync_detailed(
        client=client,
    ).parsed


async def asyncio_detailed(
    *,
    client: AuthenticatedClient | Client,
) -> Response[BillingPlanCatalogDto]:
    """The plans on offer, with what each includes and costs

     Open to anyone. Prices come from the billing provider, monthly and annual; a plan with none
    (Enterprise, or every plan on a self-hosted instance) is not self-serve and is sold through
    `salesEmail`.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[BillingPlanCatalogDto]
    """

    kwargs = _get_kwargs()

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    *,
    client: AuthenticatedClient | Client,
) -> BillingPlanCatalogDto | None:
    """The plans on offer, with what each includes and costs

     Open to anyone. Prices come from the billing provider, monthly and annual; a plan with none
    (Enterprise, or every plan on a self-hosted instance) is not self-serve and is sold through
    `salesEmail`.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        BillingPlanCatalogDto
    """

    return (
        await asyncio_detailed(
            client=client,
        )
    ).parsed

from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.sales_range import SalesRange
from ...models.sales_report_dto import SalesReportDto
from ...types import UNSET, Response, Unset


def _get_kwargs(
    workspace_id: str,
    *,
    range_: SalesRange | Unset = SalesRange.LAST_30_DAYS,
    time_zone: str | Unset = UNSET,
) -> dict[str, Any]:

    params: dict[str, Any] = {}

    json_range_: str | Unset = UNSET
    if not isinstance(range_, Unset):
        json_range_ = range_.value

    params["range"] = json_range_

    params["timeZone"] = time_zone

    params = {k: v for k, v in params.items() if v is not UNSET and v is not None}

    _kwargs: dict[str, Any] = {
        "method": "get",
        "url": "/api/v1/workspaces/{workspace_id}/analytics/sales".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
        "params": params,
    }

    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> SalesReportDto | None:
    if response.status_code == 200:
        response_200 = SalesReportDto.from_dict(response.json())

        return response_200

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[SalesReportDto]:
    return Response(
        status_code=HTTPStatus(response.status_code),
        content=response.content,
        headers=response.headers,
        parsed=_parse_response(client=client, response=response),
    )


def sync_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    range_: SalesRange | Unset = SalesRange.LAST_30_DAYS,
    time_zone: str | Unset = UNSET,
) -> Response[SalesReportDto]:
    """Sales over time, by store, compared with the period before

     Order totals in the workspace currency, bucketed in the given time zone. Cancelled orders and orders
    in other currencies are left out.

    Args:
        workspace_id (str):
        range_ (SalesRange | Unset):  Default: SalesRange.LAST_30_DAYS.
        time_zone (str | Unset):  Example: America/New_York.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[SalesReportDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        range_=range_,
        time_zone=time_zone,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    range_: SalesRange | Unset = SalesRange.LAST_30_DAYS,
    time_zone: str | Unset = UNSET,
) -> SalesReportDto | None:
    """Sales over time, by store, compared with the period before

     Order totals in the workspace currency, bucketed in the given time zone. Cancelled orders and orders
    in other currencies are left out.

    Args:
        workspace_id (str):
        range_ (SalesRange | Unset):  Default: SalesRange.LAST_30_DAYS.
        time_zone (str | Unset):  Example: America/New_York.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        SalesReportDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
        range_=range_,
        time_zone=time_zone,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    range_: SalesRange | Unset = SalesRange.LAST_30_DAYS,
    time_zone: str | Unset = UNSET,
) -> Response[SalesReportDto]:
    """Sales over time, by store, compared with the period before

     Order totals in the workspace currency, bucketed in the given time zone. Cancelled orders and orders
    in other currencies are left out.

    Args:
        workspace_id (str):
        range_ (SalesRange | Unset):  Default: SalesRange.LAST_30_DAYS.
        time_zone (str | Unset):  Example: America/New_York.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[SalesReportDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        range_=range_,
        time_zone=time_zone,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    range_: SalesRange | Unset = SalesRange.LAST_30_DAYS,
    time_zone: str | Unset = UNSET,
) -> SalesReportDto | None:
    """Sales over time, by store, compared with the period before

     Order totals in the workspace currency, bucketed in the given time zone. Cancelled orders and orders
    in other currencies are left out.

    Args:
        workspace_id (str):
        range_ (SalesRange | Unset):  Default: SalesRange.LAST_30_DAYS.
        time_zone (str | Unset):  Example: America/New_York.

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        SalesReportDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            range_=range_,
            time_zone=time_zone,
        )
    ).parsed

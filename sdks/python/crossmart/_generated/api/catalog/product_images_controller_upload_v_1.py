from http import HTTPStatus
from typing import Any
from urllib.parse import quote

import httpx

from ... import errors
from ...client import AuthenticatedClient, Client
from ...models.product_images_controller_upload_v1_body import (
    ProductImagesControllerUploadV1Body,
)
from ...models.uploaded_image_dto import UploadedImageDto
from ...types import Response


def _get_kwargs(
    workspace_id: str,
    *,
    body: ProductImagesControllerUploadV1Body,
) -> dict[str, Any]:
    headers: dict[str, Any] = {}

    _kwargs: dict[str, Any] = {
        "method": "post",
        "url": "/api/v1/workspaces/{workspace_id}/media/product-images".format(
            workspace_id=quote(str(workspace_id), safe=""),
        ),
    }

    _kwargs["files"] = body.to_multipart()

    headers["Content-Type"] = "multipart/form-data; boundary=+++"

    _kwargs["headers"] = headers
    return _kwargs


def _parse_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> UploadedImageDto | None:
    if response.status_code == 201:
        response_201 = UploadedImageDto.from_dict(response.json())

        return response_201

    if client.raise_on_unexpected_status:
        raise errors.UnexpectedStatus(response.status_code, response.content)
    else:
        return None


def _build_response(
    *, client: AuthenticatedClient | Client, response: httpx.Response
) -> Response[UploadedImageDto]:
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
    body: ProductImagesControllerUploadV1Body,
) -> Response[UploadedImageDto]:
    """Upload a product image

     Returns a URL to put in a product’s `media`. The format is read from the file.

    Args:
        workspace_id (str):
        body (ProductImagesControllerUploadV1Body):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[UploadedImageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        body=body,
    )

    response = client.get_httpx_client().request(
        **kwargs,
    )

    return _build_response(client=client, response=response)


def sync(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: ProductImagesControllerUploadV1Body,
) -> UploadedImageDto | None:
    """Upload a product image

     Returns a URL to put in a product’s `media`. The format is read from the file.

    Args:
        workspace_id (str):
        body (ProductImagesControllerUploadV1Body):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        UploadedImageDto
    """

    return sync_detailed(
        workspace_id=workspace_id,
        client=client,
        body=body,
    ).parsed


async def asyncio_detailed(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: ProductImagesControllerUploadV1Body,
) -> Response[UploadedImageDto]:
    """Upload a product image

     Returns a URL to put in a product’s `media`. The format is read from the file.

    Args:
        workspace_id (str):
        body (ProductImagesControllerUploadV1Body):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        Response[UploadedImageDto]
    """

    kwargs = _get_kwargs(
        workspace_id=workspace_id,
        body=body,
    )

    response = await client.get_async_httpx_client().request(**kwargs)

    return _build_response(client=client, response=response)


async def asyncio(
    workspace_id: str,
    *,
    client: AuthenticatedClient | Client,
    body: ProductImagesControllerUploadV1Body,
) -> UploadedImageDto | None:
    """Upload a product image

     Returns a URL to put in a product’s `media`. The format is read from the file.

    Args:
        workspace_id (str):
        body (ProductImagesControllerUploadV1Body):

    Raises:
        errors.UnexpectedStatus: If the server returns an undocumented status code and Client.raise_on_unexpected_status is True.
        httpx.TimeoutException: If the request takes longer than Client.timeout.

    Returns:
        UploadedImageDto
    """

    return (
        await asyncio_detailed(
            workspace_id=workspace_id,
            client=client,
            body=body,
        )
    ).parsed

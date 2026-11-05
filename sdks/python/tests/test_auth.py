from __future__ import annotations

import httpx
import pytest
import respx

from crossmart import Crossmart, CrossmartConfigurationError
from crossmart._constants import USER_AGENT, EnvironmentVariable
from crossmart._options import CredentialKind, resolve_credentials

from .conftest import API_KEY, BASE_URL, WORKSPACE_ID, WORKSPACE_PATH, fixture

ACCESS_TOKEN = "agent-access-token"


def _stub_workspace(api: respx.MockRouter) -> respx.Route:
    return api.get(WORKSPACE_PATH).respond(json=fixture("WorkspaceDto"))


def test_sends_an_api_key_in_the_x_api_key_header(api: respx.MockRouter) -> None:
    route = _stub_workspace(api)
    with Crossmart(api_key=API_KEY, base_url=BASE_URL, workspace_id=WORKSPACE_ID) as client:
        client.workspaces.get()

    request = route.calls.last.request
    assert request.headers["x-api-key"] == API_KEY
    assert "authorization" not in request.headers
    assert request.headers["user-agent"] == USER_AGENT


def test_sends_an_access_token_as_a_bearer_token(api: respx.MockRouter) -> None:
    route = _stub_workspace(api)
    with Crossmart(
        access_token=ACCESS_TOKEN, base_url=BASE_URL, workspace_id=WORKSPACE_ID
    ) as client:
        client.workspaces.get()

    request = route.calls.last.request
    assert request.headers["authorization"] == f"Bearer {ACCESS_TOKEN}"
    assert "x-api-key" not in request.headers


def test_reads_credentials_and_settings_from_the_environment(
    api: respx.MockRouter, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv(EnvironmentVariable.API_KEY, API_KEY)
    monkeypatch.setenv(EnvironmentVariable.BASE_URL, BASE_URL)
    monkeypatch.setenv(EnvironmentVariable.WORKSPACE_ID, WORKSPACE_ID)
    route = _stub_workspace(api)

    with Crossmart() as client:
        client.workspaces.get()

    assert route.calls.last.request.headers["x-api-key"] == API_KEY


def test_accepts_a_base_url_that_includes_the_api_prefix(api: respx.MockRouter) -> None:
    route = _stub_workspace(api)
    with Crossmart(
        api_key=API_KEY, base_url=f"{BASE_URL}/api/v1/", workspace_id=WORKSPACE_ID
    ) as client:
        client.workspaces.get()

    assert route.called


def test_refuses_to_start_without_credentials() -> None:
    with pytest.raises(CrossmartConfigurationError, match="api_key or access_token"):
        Crossmart()


def test_refuses_both_kinds_of_credentials() -> None:
    with pytest.raises(CrossmartConfigurationError, match="not both"):
        Crossmart(api_key=API_KEY, access_token=ACCESS_TOKEN)


def test_arguments_win_over_the_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(EnvironmentVariable.API_KEY, "from-environment")

    credentials = resolve_credentials(None, ACCESS_TOKEN)

    assert credentials.kind is CredentialKind.ACCESS_TOKEN


def test_keeps_secrets_out_of_the_credentials_repr() -> None:
    assert API_KEY not in repr(resolve_credentials(API_KEY, None))


def test_looks_up_the_api_keys_workspace_once(api: respx.MockRouter) -> None:
    current_key = {**fixture("CurrentApiKeyDto"), "workspaceId": WORKSPACE_ID}
    key_route = api.get("/api/v1/api-key").respond(json=current_key)
    workspace_route = _stub_workspace(api)

    with Crossmart(api_key=API_KEY, base_url=BASE_URL) as client:
        client.workspaces.get()
        client.workspaces.get()
        assert client.workspace_id == WORKSPACE_ID

    assert key_route.call_count == 1
    assert workspace_route.call_count == 2


def test_needs_a_workspace_id_with_an_access_token() -> None:
    with (
        Crossmart(access_token=ACCESS_TOKEN, base_url=BASE_URL) as client,
        pytest.raises(CrossmartConfigurationError, match="workspace_id"),
    ):
        client.workspaces.get()


def test_accepts_a_custom_transport() -> None:
    transport = httpx.MockTransport(
        lambda request: httpx.Response(200, json=fixture("WorkspaceDto"))
    )
    with Crossmart(
        api_key=API_KEY, base_url=BASE_URL, workspace_id=WORKSPACE_ID, transport=transport
    ) as client:
        assert client.workspaces.get().slug == "sample"

# ADR 0005: Multi-repo under the crossmart-io org

- Status: Accepted
- Date: 2026-10-31

## Context

The founder wants frontend and backend in separate repos, and the marketing site private. The GitHub name 'crossmart' is taken by an unrelated user.

## Decision

Org crossmart-io. Repos: crossmart (backend + worker + mcp + connectors, public), crossmart-web (public), crossmart-docs (public), crossmart-site (private), crossmart-cloud (private, later).

## Consequences

API changes span two repos. The API is versioned (/api/v1), openapi.json is published per release, and web CI detects breaking changes.

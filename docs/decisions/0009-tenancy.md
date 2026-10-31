# ADR 0009: Organization → Workspace → Members

- Status: Accepted
- Date: 2026-10-31

## Context

The product serves both single merchants and agencies with many clients.

## Decision

Organization (billing) contains Workspaces (catalog + channels), which contain Members with the roles Owner, Admin, Editor, Viewer and Approver. A shared database with workspace_id plus Postgres RLS. Better Auth for auth, plus workspace API keys.

## Consequences

Merchants never see the workspace concept. A database per tenant is possible later for enterprise.

# ADR 0002: AI-native operation plus an agent-accessible API

- Status: Accepted
- Date: 2026-10-31

## Context

Rules engines in incumbent tools (Channable and others) are manual and painful. AI agents are well suited to content, category mapping and fixing rejections.

## Decision

Internal agents produce Suggestions (diff + rationale) that users approve. Autonomy policies per workspace and action type allow auto-apply. The REST API and MCP server expose the same capabilities to external agents, subject to the same policies.

## Consequences

A Suggestion and approval engine is core infrastructure. Every agent write is auditable and can be undone.

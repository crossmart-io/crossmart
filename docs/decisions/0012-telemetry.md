# ADR 0012: Anonymous opt-out telemetry for self-hosted installs

- Status: Accepted
- Date: 2026-10-31

## Context

Usage signals are needed without losing the trust of the self-hosting community.

## Decision

A daily anonymous ping (instance id, version, connector counts, listing bucket). Never business data. Disabled with CROSSMART_TELEMETRY=false, logged on first boot and documented.

## Consequences

Telemetry is not implemented yet. Follow-up: when it ships, it must ship together with a public
page that documents the exact payload and how to turn it off, and the first-boot log line must
link to that page.

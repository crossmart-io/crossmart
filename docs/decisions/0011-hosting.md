# ADR 0011: Railway for the cloud, Docker everywhere

- Status: Accepted
- Date: 2026-10-31

## Context

A solo founder needs low operational overhead.

## Decision

Railway (US East), deployed from Dockerfiles (not auto-builders), with staging and production environments, a static egress IP, managed Postgres with PITR plus a daily off-site dump, and envelope encryption for secrets.

## Consequences

Self-host and cloud use the same images, so moving to AWS later is a migration rather than a rewrite.

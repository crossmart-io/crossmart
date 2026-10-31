# ADR 0013: Starlight docs and an Astro marketing site

- Status: Accepted
- Date: 2026-10-31

## Context

Docs are part of the product for an open-source tool, and they must be readable by AI agents.

## Decision

Starlight (Astro) in the public crossmart-docs repo at docs.crossmart.io. The API reference is generated from openapi.json, and the site provides llms.txt. The marketing site uses Astro in the private crossmart-site repo.

## Consequences

One web stack (Astro) for both docs and marketing.

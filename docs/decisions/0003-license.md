# ADR 0003: AGPL-3.0 with a CLA, trademark and plugin architecture

- Status: Accepted
- Date: 2026-10-31
- Amended: 2026-11-07. Names YIOT LLC as the owner, describes the CLA as a license grant rather
  than an assignment, says the trademark is owned (not registered), and moves the SDKs and
  integrations to MIT.

## Context

The goal is to be as open as possible, with revenue from hosted SaaS, while keeping the option to relicense or build closed custom work later.

## Decision

- The platform (the API, worker, MCP server and libraries) is AGPL-3.0-only, copyright YIOT LLC, a
  Delaware limited liability company.
- The SDKs (`sdks/typescript`, `sdks/python`, `sdks/php`) and integrations (`integrations/n8n`) are
  MIT, copyright YIOT LLC, so they can be embedded in any application, open or closed. The agent
  skill in `skills/crossmart` is MIT-0. [NOTICE](../../NOTICE) lists the exceptions.
- Contributors sign the [CLA](../../CLA.md). It grants YIOT LLC a broad copyright and patent
  license, including the right to distribute contributions under other license terms. It is not an
  assignment: contributors keep the copyright to their work.
- The Crossmart name and logo are trademarks owned by YIOT LLC and are not covered by the code
  licenses.
- Extensibility comes through plugins, and custom enterprise work ships as separate plugins.

## Consequences

YIOT LLC can dual-license and change the license of future versions. Released versions stay
AGPL. Competing hosted forks must open their changes. Client code that uses the SDKs or the n8n
node is not bound by the AGPL.

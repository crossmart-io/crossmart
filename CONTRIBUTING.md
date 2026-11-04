# Contributing to Crossmart

Thanks for helping build Crossmart. This guide explains how to set up the project, the standards every change must meet, and how to get a pull request merged.

## Before you start

- For anything larger than a small fix, open an issue first so we can agree on the approach.
- Look for issues labelled `good first issue` if you are new to the codebase.
- Read [docs/architecture.md](docs/architecture.md) and the decision records in [docs/decisions](docs/decisions).

## Development setup

```bash
pnpm install
cp .env.example .env    # then set BETTER_AUTH_SECRET: openssl rand -base64 32
docker compose up -d postgres redis
pnpm db:migrate
pnpm start:api
```

Useful scripts:

| Script                        | Purpose                                     |
| ----------------------------- | ------------------------------------------- |
| `pnpm lint` / `pnpm lint:fix` | oxlint with type-aware rules                |
| `pnpm format`                 | Prettier                                    |
| `pnpm typecheck`              | TypeScript across all apps and libraries    |
| `pnpm test` / `pnpm test:e2e` | Unit and end-to-end tests (Vitest)          |
| `pnpm db:migrate`             | Create and apply a migration in development |

## Code standards

Crossmart is read by many people. Code must be clear, modular and predictable. CI enforces most of these rules.

**Structure**

- Follow the NestJS feature-module layout: `controllers/`, `services/`, `repositories/`, `dto/`, `entities/`, `enums/`, `<module>.constants.ts`.
- One responsibility per class and per function. Extract heavy logic into small, well-named methods.
- Put shared logic in `libs/common`, never copy it.
- Anything swappable (connectors, AI providers, billing) sits behind an interface.

**No magic values**

- Use string enums for closed sets of values: `ListingStatus.Active`, never `'active'`.
- Use named constants in `*.constants.ts` for other literals (keys, limits, routes, queue names).
- Never hardcode plan names or limits. Use the entitlements service.

**Types and naming**

- TypeScript `strict`, and no `any`.
- Use typed DTOs and classes with class-validator for input. Never pass ad-hoc objects or JSON blobs around.
- Use descriptive names (`variantId`, `pendingSuggestions`), never `i`, `tmp` or `data`.
- In NestJS apps, read configuration only through `AppConfigService`, never `process.env`.

**Always consider**

- **Security:** every tenant-scoped query is filtered by `workspaceId`. Never log secrets.
- **Performance:** batch external calls, paginate, and avoid N+1 queries.
- **Compatibility:** the API is versioned (`/api/v1`). Migrations are additive. Breaking changes need a deprecation path.

**Tests**

- Every service gets unit tests, and every endpoint gets an e2e test.
- Connectors need contract tests with recorded fixtures. Never call live marketplace APIs in CI.

## Commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat(catalog): add variant bulk update`, `fix(ebay): handle expired tokens`. A commit hook checks the format.
- Keep pull requests focused. Fill in the PR template and link the issue.
- CI must be green: lint, typecheck, tests and build.

## Contributor License Agreement

Before your first pull request can be merged, you must sign the [Contributor License Agreement](CLA.md). A bot asks you to sign by posting a comment on the PR. You keep the copyright to your contribution. The CLA grants the project the rights it needs to distribute your contribution, including under other license terms.

## Adding a marketplace connector

Connectors live in `libs/connectors`. Each one implements `ChannelConnector` and declares its capabilities. A detailed guide will be published at docs.crossmart.io as the SDK stabilises. Until then, open an issue to discuss a new connector.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be kind and constructive.

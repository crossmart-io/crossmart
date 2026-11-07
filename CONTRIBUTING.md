# Contributing to Crossmart

Thanks for helping build Crossmart. This guide explains how to set up the project, the standards every change must meet, and how to get a pull request merged.

## Before you start

- For anything larger than a small fix, open an issue first so we can agree on the approach.
- Look for issues labelled `good first issue` if you are new to the codebase.
- Read [docs/architecture.md](docs/architecture.md) and the decision records in [docs/decisions](docs/decisions).

## Development setup

You need Node.js 22 or 24 (`.nvmrc` pins 24), pnpm 10, and Docker or your own PostgreSQL 16+ and
Redis 7+. The [README quick start](README.md#quick-start-development) explains each setting.

```bash
pnpm install
cp .env.example .env    # then set BETTER_AUTH_SECRET and CREDENTIALS_MASTER_KEY (openssl rand -base64 32),
                        # and POSTGRES_PASSWORD / REDIS_PASSWORD (openssl rand -hex 24) in the URLs too
docker compose up -d postgres redis
pnpm db:generate        # the Prisma client; the build and typecheck need it
pnpm db:deploy          # applies the existing migrations
pnpm start:api
```

Channel credentials and `ANTHROPIC_API_KEY` are optional for local development.

Useful scripts:

| Script                        | Purpose                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint` / `pnpm lint:fix` | oxlint with type-aware rules                                                                                        |
| `pnpm format`                 | Prettier                                                                                                            |
| `pnpm typecheck`              | TypeScript across all apps and libraries                                                                            |
| `pnpm test`                   | Unit tests (Vitest)                                                                                                 |
| `pnpm test:e2e`               | End-to-end tests (Vitest). They need a migrated database and Redis, see below                                       |
| `pnpm db:generate`            | Generate the Prisma client. Run it after `pnpm install` and after every schema change                               |
| `pnpm db:deploy`              | Apply pending migrations (`prisma migrate deploy`). Use it for first-time setup and after pulling                   |
| `pnpm db:migrate`             | `prisma migrate dev`: create a migration from your schema change and apply it. Only when you change the schema      |
| `pnpm openapi:generate`       | Write `openapi.json` from the built API (`pnpm build:api` first). The SDKs and the web client are generated from it |

The e2e tests run the real API against `DATABASE_URL` and `REDIS_URL`, and leave the rows they
create behind. Point them at a separate, migrated database rather than the one you develop with:

```bash
docker compose exec postgres createdb -U crossmart crossmart_e2e   # or createdb with your own PostgreSQL
DATABASE_URL=postgresql://crossmart:<password>@localhost:5432/crossmart_e2e pnpm db:deploy
DATABASE_URL=postgresql://crossmart:<password>@localhost:5432/crossmart_e2e pnpm test:e2e
```

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
- Checks must be green. GitHub Actions run them on every pull request ([ci.yml](.github/workflows/ci.yml)): format, lint, typecheck, unit and e2e tests, build, and the SDK and n8n node checks. Before merging, a maintainer also verifies the pull request locally, merged with the latest `main`. Run the same commands before you push:

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:deploy             # against a throwaway database, for the e2e tests
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e              # needs Postgres and Redis: docker compose up -d postgres redis
pnpm openapi:generate      # writes openapi.json for the SDK drift checks

# Only when you change an SDK or the API
(cd sdks/typescript && pnpm install && pnpm check:drift && pnpm lint && pnpm typecheck && pnpm test && pnpm build)
(cd sdks/python && scripts/generate.sh && git diff --exit-code -- crossmart/_generated && ruff check . && ruff format --check . && mypy && pytest)
sdks/php/scripts/check.sh  # after composer install in sdks/php

# Only when you change the n8n node
(cd integrations/n8n && pnpm install && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build)
```

- Workflows never publish, deploy or use secrets. Releases are made by a maintainer by hand ([sdks/RELEASING.md](sdks/RELEASING.md)).

## Contributor License Agreement

Before your first pull request can be merged, you must sign the [Contributor License Agreement](CLA.md) with YIOT LLC, the company that owns Crossmart. The CLA bot comments on your pull request; to sign, reply with the sentence it gives you. You sign once, and it covers your later contributions.

The CLA is a license, not an assignment: you keep the copyright to your contribution. It grants YIOT LLC the rights it needs to distribute your contribution, including under other license terms, which keeps dual licensing possible. The platform is [AGPL-3.0](LICENSE); the SDKs and the n8n node are MIT (see [NOTICE](NOTICE)).

## Adding a marketplace connector

Connectors live in `libs/connectors`. Each one implements `ChannelConnector` and declares its capabilities. A detailed guide will be published at docs.crossmart.io as the SDK stabilises. Until then, open an issue to discuss a new connector.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be kind and constructive.

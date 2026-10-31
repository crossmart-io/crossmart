# Crossmart backend: agent instructions

Read [CONTRIBUTING.md](CONTRIBUTING.md) first. Its code standards are mandatory: no magic strings (enums and constants),
small single-purpose functions, typed DTOs and classes, shared logic in `libs/common`, and config only through `AppConfigService`.

- Architecture: [docs/architecture.md](docs/architecture.md). Decisions: [docs/decisions](docs/decisions).
- Verify every change with `pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
- NestJS DI needs value imports of injected classes, so do not convert them to `import type`.
- Code, comments, commits and docs are in English. Use Conventional Commits.

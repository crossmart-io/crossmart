# ADR 0004: TypeScript with NestJS, Prisma, PostgreSQL, BullMQ and a React/Vite SPA

- Status: Accepted
- Date: 2026-10-31

## Context

The founder has a Java/Spring background. One language lowers the barrier for contributors. The app is a classic frontend and backend talking REST.

## Decision

NestJS (Spring-like DI and modules), Prisma + PostgreSQL (JSONB, RLS), BullMQ + Redis for jobs, a React + Vite SPA with shadcn/ui, REST + OpenAPI with a generated client, and Better Auth.

## Consequences

Complex JSONB queries use TypedSQL or raw SQL. There is no SSR in the app, and the marketing site and docs use Astro.

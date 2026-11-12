# Helpdesk NestJS API

NestJS uses the existing PostgreSQL database through Prisma. Historical Laravel behavior and schema findings are recorded in `../docs/ai/migration-audit.md`.

## Runtime configuration

Provide `DATABASE_URL`, a PostgreSQL connection string, and `JWT_SECRET` with at least 32 characters through the deployment environment. Do not commit `.env` files.

Run the API with `npm run start:dev`. Routes use the `/api` prefix.

## Verification

Run `npm test`, `npm run build`, and `npm run lint`. PostgreSQL endpoint tests use a dedicated test database/schema: set `DATABASE_URL_TEST` to that isolated target, apply the reviewed migrations there, then run `npm run test:e2e`. The E2E test creates randomized users and tickets and removes only its own test rows.

The Prisma migration history adopts the existing Laravel-managed `users` and `tickets` tables through `20261111000000_baseline_laravel_schema`. On an existing database, verify those tables and mark that baseline as applied with `prisma migrate resolve --applied 20261111000000_baseline_laravel_schema`; do not execute its SQL there. Then `prisma migrate deploy` applies the additive `auth_sessions` migration. Never use `prisma db push` against the shared database.

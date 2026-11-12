
---
name: prisma-postgresql
description: Work with Prisma ORM and PostgreSQL, including schema introspection, relations, queries and safe database access.
---

# Prisma and PostgreSQL

## Purpose

Use Prisma safely with the existing Helpdesk PostgreSQL database.

## Rules

- Existing PostgreSQL is the source of truth.
- Inspect the existing schema before defining Prisma models.
- Prefer prisma db pull for initial introspection.
- Preserve existing table names and column mappings.
- Review relations and foreign keys carefully.
- Use explicit mappings when database naming differs from Prisma naming.
- Use transactions for operations requiring atomicity.
- Avoid N+1 queries.
- Use appropriate indexes.

## Critical Safety

Never run without explicit approval:

- prisma migrate dev
- prisma migrate deploy
- prisma db push
- prisma migrate reset
- Any destructive SQL

Never recreate the database.

Never modify existing production data.

## Before Database Changes

1. Inspect current schema.
2. Explain the proposed change.
3. Identify affected tables.
4. Explain data migration risks.
5. Wait for approval.

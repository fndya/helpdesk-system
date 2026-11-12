---
name: laravel-to-nestjs-migration
description: Consult the retired Laravel contract when maintaining NestJS compatibility. Use for historical migration context, not new Laravel implementation.
---

# Laravel to NestJS Migration

Use this skill for compatibility questions or follow-up changes based on the retired Laravel backend. Laravel runtime code is no longer present; use `docs/ai/migration-audit.md` as the historical contract record. Do not create new Laravel code.

## Invariants

- Laravel was the behavioral reference; NestJS is the active target. Treat only behaviors supported by the audit's recorded source inspection/tests as **verified**. The Laravel source has been retired, so do not claim new runtime verification against it.
- Both backends coexisted during migration. Retirement was explicitly approved after parity checks; do not restore Laravel runtime as part of ordinary work.
- PostgreSQL is the existing shared source of truth. Never recreate, reset, delete data from, or perform destructive operations against it. Never execute destructive database operations, `prisma db push`, or Prisma migrations without explicit approval for the specific operation.
- Preserve routes, methods, status codes, input validation, authorization, and response shape/semantics. Treat deviations as intentional only with explicit approval.
- Keep follow-up compatibility changes small and independently reviewable. Do not restore Laravel runtime or change shared database state without explicit approval.

## Workflow

1. Inspect repository instructions, the historical audit, relevant NestJS code, and existing project skills.
2. Map the requested behavior using the audit and tests. Distinguish recorded Laravel facts from unknowns and assumptions.
3. Define the smallest compatibility slice and its contract using the audit and NestJS tests: affected endpoint/behavior, expected responses and authorization, database reads/writes, and tests.
4. Implement the target slice following the existing NestJS architecture. Keep changes additive and compatible with shared PostgreSQL. Do not change schema or run database writes/migrations without the approval described above.
5. Compare Laravel and NestJS behavior with equivalent tests or fixtures. Fix discrepancies before marking the slice verified. Report unverified cases and assumptions.
6. Review the diff and data-safety implications. The migration and Laravel retirement are complete; do not perform database cleanup without operation-specific explicit approval.

## Component mapping

Use this as a discovery map, not a one-to-one prescription; preserve behavior rather than framework structure.

| Laravel | NestJS target |
| --- | --- |
| Routes and middleware | Module/controller routes and guards/interceptors as appropriate |
| Controller | Thin controller for HTTP concerns |
| Form Request | DTO validation and applicable authorization checks |
| Service/action | Injectable service containing business behavior |
| Policy/Gate | Guard or policy-style authorization logic; enforce resource-level rules in the proper service boundary |
| API Resource/transformer | Explicit response mapping/serialization |
| Eloquent model/query | Prisma model/query, preserving existing database names and relations |
| Enum/constants | TypeScript enum or constrained domain type, matching verified values |
| Laravel feature/unit tests | NestJS unit/integration tests plus parity cases against the Laravel contract |

Read `.agents/skills/nestjs-architecture/SKILL.md`, `.agents/skills/prisma-postgresql/SKILL.md`, `.agents/skills/auth-security/SKILL.md`, and `.agents/skills/testing-code-review/SKILL.md` when their areas are involved. Those skills and `AGENTS.md` are complementary project guidance; this skill supplies migration sequencing and parity requirements.

## Authentication migration

- Consult the audit's recorded Sanctum configuration, guards, token issuance and expiry, revocation/logout, credential validation, password hashing, middleware, and test findings.
- Do not assume JWT is equivalent to Sanctum or silently choose a token strategy. Identify compatibility and lifecycle implications, and get approval for an authentication design change before implementing it.
- Preserve existing authentication behavior for the migrated slice, including unauthorized status and response behavior. Never expose or log credentials, password hashes, or tokens. Do not copy plaintext secrets into code or artifacts.

## Roles and permissions

- Verify role names, assignment/storage, route-level access, ownership checks, and status-dependent rules in Laravel policies, middleware, services, and tests.
- Do not infer permissions from role labels or from the project’s illustrative role list. Translate each verified permission and resource-ownership condition, then cover allowed, forbidden, and unauthenticated cases.
- Never trust role or ownership claims from client input. Keep existing role data intact in the shared database; any role/schema/data transformation needs a reviewed plan and explicit approval before execution.

## Database compatibility

- Consult the recorded PostgreSQL schema findings and Prisma mappings. Keep table/column names, types, nullability, defaults, keys, relations, and enum representation compatible.
- Treat Prisma schema declarations as descriptions of the existing database until a schema change is explicitly approved. Do not use `db push`, migrations, reset, destructive SQL, or data-changing scripts without operation-specific explicit approval.
- Prefer read-only schema inspection. Do not connect to or modify a database unless the user has authorized that access for the task. Never expose credentials.
- For each migrated write, compare transaction boundaries, constraints, defaults, timestamps, and failure behavior. Avoid dual writes unless a reviewed design defines consistency and recovery.

## API contract verification

For each endpoint or behavior, compare Laravel and NestJS on:

- Route, HTTP method, authentication requirement, and role/resource authorization.
- Accepted fields, required/nullable rules, formats, limits, coercion, and validation error structure/status.
- Success and failure status codes, response envelope, field names/types/nullability, ordering/pagination, and side effects.
- Edge cases established by Laravel tests or implementation.

Use verified historical Laravel behavior in the audit as the expected contract, while distinguishing observed implementation details from intentional documented guarantees. Do not claim parity based only on matching happy paths.

## Testing requirements

- Every migrated business behavior requires tests before it is considered verified: unit tests for business rules and endpoint integration tests for the externally visible contract where applicable.
- Cover success, validation failures, unauthenticated and forbidden requests, role/ownership boundaries, and relevant database behavior. Add parity cases based on verified Laravel behavior.
- Use isolated test data and a dedicated test database/configuration. Never run destructive or reset-style tests against the shared development or production database.
- Run relevant tests when authorized and report exactly what ran and its result. If tests cannot run safely, leave the behavior unverified and report the blocker; do not imply completion.

## Security requirements

- Validate all external input and authorize every protected operation server-side.
- Preserve password hashing and token protections; exclude secrets and password hashes from responses, logs, and fixtures.
- Review authentication, authorization, ownership, injection exposure, and sensitive response fields for each slice. Consult `auth-security` for detailed target implementation rules.

## Completion criteria

A follow-up compatibility change is complete when the behavior is grounded in the historical audit or explicitly identified as uncertain, the NestJS contract is tested, database compatibility and security are reviewed, and relevant checks pass. The Laravel runtime has been retired; preserve its migrations as historical records.

---
name: laravel-to-nestjs-migration
description: Migrate Helpdesk behavior from the Laravel reference backend to NestJS while preserving API and shared PostgreSQL compatibility. Use for migration planning, implementation, or verification; not for unrelated Laravel or NestJS work.
---

# Laravel to NestJS Migration

Use this skill whenever work moves Helpdesk backend behavior from Laravel to NestJS, including planning, implementation, compatibility review, and cutover preparation.

## Invariants

- Laravel is the behavioral reference; NestJS is the target. Verify rules in Laravel before porting them. Label behavior **verified** only when supported by Laravel code or observed tests; state assumptions explicitly and resolve them before relying on them.
- Both backends coexist during migration. Keep Laravel operational until NestJS behavior is verified and cutover is explicitly approved.
- PostgreSQL is the existing shared source of truth. Never recreate, reset, delete data from, or perform destructive operations against it. Never execute destructive database operations, `prisma db push`, or Prisma migrations without explicit approval for the specific operation.
- Preserve routes, methods, status codes, input validation, authorization, and response shape/semantics. Treat deviations as intentional only with explicit approval.
- Implement and verify in small, independently reviewable slices. Do not switch production traffic or retire Laravel as an incidental part of implementation.

## Workflow

1. Inspect repository instructions and relevant Laravel routes, controllers, requests, resources, policies, services, models, enums, tests, and database schema. Inspect the NestJS target and existing project skills before choosing an implementation.
2. Map the requested behavior end to end. Record its Laravel source and what is verified, unknown, or assumed. Ask for clarification when an unknown affects compatibility or data safety.
3. Define the smallest migration slice and its contract: affected endpoint/behavior, expected responses and authorization, database reads/writes, and tests. Keep Laravel unchanged unless explicitly requested.
4. Implement the target slice following the existing NestJS architecture. Keep changes additive and compatible with shared PostgreSQL. Do not change schema or run database writes/migrations without the approval described above.
5. Compare Laravel and NestJS behavior with equivalent tests or fixtures. Fix discrepancies before marking the slice verified. Report unverified cases and assumptions.
6. Review the diff, data-safety implications, and Laravel availability. Mark migration complete only when completion criteria below are met; cutover or Laravel retirement requires separate explicit approval.

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

- Inspect Sanctum configuration, guards, token issuance and expiry, revocation/logout, credential validation, password hashing, middleware, and tests in Laravel. Record what clients actually send and receive.
- Do not assume JWT is equivalent to Sanctum or silently choose a token strategy. Identify compatibility and lifecycle implications, and get approval for an authentication design change before implementing it.
- Preserve existing authentication behavior for the migrated slice, including unauthorized status and response behavior. Never expose or log credentials, password hashes, or tokens. Do not copy plaintext secrets into code or artifacts.

## Roles and permissions

- Verify role names, assignment/storage, route-level access, ownership checks, and status-dependent rules in Laravel policies, middleware, services, and tests.
- Do not infer permissions from role labels or from the project’s illustrative role list. Translate each verified permission and resource-ownership condition, then cover allowed, forbidden, and unauthenticated cases.
- Never trust role or ownership claims from client input. Keep existing role data intact in the shared database; any role/schema/data transformation needs a reviewed plan and explicit approval before execution.

## Database compatibility

- Inspect the existing PostgreSQL schema and Laravel model mappings before designing Prisma models. Keep table/column names, types, nullability, defaults, keys, relations, and enum representation compatible.
- Treat Prisma schema declarations as descriptions of the existing database until a schema change is explicitly approved. Do not use `db push`, migrations, reset, destructive SQL, or data-changing scripts without operation-specific explicit approval.
- Prefer read-only schema inspection. Do not connect to or modify a database unless the user has authorized that access for the task. Never expose credentials.
- For each migrated write, compare transaction boundaries, constraints, defaults, timestamps, and failure behavior. Avoid dual writes unless a reviewed design defines consistency and recovery.

## API contract verification

For each endpoint or behavior, compare Laravel and NestJS on:

- Route, HTTP method, authentication requirement, and role/resource authorization.
- Accepted fields, required/nullable rules, formats, limits, coercion, and validation error structure/status.
- Success and failure status codes, response envelope, field names/types/nullability, ordering/pagination, and side effects.
- Edge cases established by Laravel tests or implementation.

Use Laravel behavior as the expected contract, while distinguishing observed implementation details from intentional documented guarantees. Do not claim parity based only on matching happy paths.

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

A migration slice is complete only when its Laravel behavior is traced and verified (or remaining uncertainty is explicitly accepted), the NestJS contract matches the verified behavior, required tests pass, database compatibility and security are reviewed, and Laravel remains operational. The overall migration is not complete until all in-scope slices meet these conditions and cutover/retirement is separately approved.

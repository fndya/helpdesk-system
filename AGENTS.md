
# Helpdesk System — AI Engineering Rules

## 1. Project Overview

The active application is NestJS, TypeScript, PostgreSQL, and Prisma, in `nestjs/`.
Laravel runtime code has been retired. Its database migrations remain as historical schema records and must not be replayed against the shared database.

Verified API behavior and migration decisions are recorded in `docs/ai/migration-audit.md` and covered by Nest tests.

## 2. Architecture Principles

- Follow modular NestJS architecture.
- Use dependency injection.
- Keep controllers thin.
- Put business logic in services.
- Use DTOs for input validation.
- Use enums for fixed domain values.
- Keep database access inside appropriate services or repositories.
- Prefer simple and maintainable solutions.
- Avoid unnecessary abstractions.

## 3. Existing Business Rules

User roles:
- USER
- SUPPORT
- ADMIN

Ticket statuses:
- OPEN
- IN_PROGRESS
- RESOLVED
- CLOSED

Ticket priorities:
- LOW
- MEDIUM
- HIGH
- URGENT

Preserve the verified rules documented in `docs/ai/migration-audit.md` and tests. Do not invent behavior. Laravel source code is no longer present; use the audit as the historical contract record.

## 4. Database Safety

- PostgreSQL is the existing source of truth.
- Never recreate the database.
- Never reset the database.
- Never delete existing data.
- Never run destructive migrations without explicit approval.
- Never execute prisma db push without explicit approval.
- Never execute prisma migrate without explicit approval.
- Never expose credentials.
- Never commit .env files.

## 5. API Rules

- Preserve existing API behavior.
- Preserve HTTP status codes where possible.
- Preserve validation rules.
- Preserve authorization behavior.
- Preserve response structure.
- NestJS owns the active API routes.
- Keep retired Laravel runtime code removed. Preserve Laravel migration files as historical schema records.

## 6. Security

- Validate all external input.
- Protect private endpoints.
- Enforce role-based authorization.
- Never return password hashes.
- Never log tokens or passwords.
- Follow secure authentication practices.

## 7. Testing

- Write tests for business logic.
- Write integration tests for API endpoints.
- Test unauthorized requests.
- Test forbidden requests.
- Test validation errors.
- Test role-based access.
- Run relevant tests after changes.

## 8. AI Agent Workflow

For every task:

1. Inspect relevant files.
2. Explain the implementation plan.
3. List files to create or modify.
4. Implement only the requested scope.
5. Run relevant tests.
6. Inspect the final diff.
7. Report completed work.
8. Report unresolved issues.

Never commit or push without approval.

## 9. Communication

- Explain important architectural decisions.
- Identify risks before implementation.
- Ask questions when requirements are ambiguous.
- Distinguish facts from assumptions.
- Do not silently change business rules.
- Be concise. Prefer short, actionable answers.
- Default response: 3–7 bullet points.
- Do not repeat task requirements or project context.
- Do not explain obvious implementation details.
- Report only: what changed, important decisions, verification results, blockers.
- Show code only when necessary.
- Provide detailed explanations only when explicitly requested.
- Ask one question at a time.

## 10. Golden Rule

Correctness and data safety are more important than implementation speed.


---
name: nestjs-architecture
description: Design and implement maintainable modular NestJS backends using controllers, services, modules, DTOs and dependency injection. Use when creating or reviewing NestJS architecture.
---

# NestJS Architecture

## Purpose

Build maintainable and testable NestJS applications.

## Rules

- Organize functionality into feature modules.
- Use controllers only for HTTP concerns.
- Put business logic in services.
- Use constructor dependency injection.
- Use DTOs for request validation.
- Use class-validator where appropriate.
- Use guards for authentication and authorization.
- Avoid giant services and controllers.
- Avoid circular dependencies.
- Follow TypeScript strict mode.

## Module Structure

Prefer feature-oriented modules:

src/
  auth/
  users/
  tickets/
  comments/
  common/
  app.module.ts
  main.ts

## Controller Rules

Controllers must:
- Define HTTP routes.
- Receive validated DTOs.
- Call services.
- Return appropriate HTTP responses.

Controllers must not contain complex business logic.

## Service Rules

Services must:
- Implement business logic.
- Coordinate database operations.
- Enforce business invariants.
- Be independently testable.

## Before Implementation

1. Inspect existing architecture.
2. Identify the correct module.
3. List files to create or modify.
4. Explain dependencies.
5. Implement the smallest reasonable solution.

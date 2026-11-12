
---
name: auth-security
description: Implement secure authentication, authorization, JWT, guards and role-based access control in NestJS.
---

# Authentication and Security

## Purpose

Implement secure authentication and authorization.

## Project Roles

- USER
- SUPPORT
- ADMIN

## Rules

- Protect private API endpoints.
- Validate credentials.
- Hash passwords using a secure password hashing algorithm.
- Never store plaintext passwords.
- Never return password hashes.
- Never expose access tokens in logs.
- Implement authorization on the server.
- Never trust role information supplied by clients.
- Use guards for endpoint protection.
- Enforce resource ownership rules.

## Authorization

Verified historical ticket behavior (see `docs/ai/migration-audit.md`):

- USER can access their own tickets.
- SUPPORT can access all tickets.
- ADMIN can access all tickets.

Do not assume these rules apply to every resource without checking requirements.

## Token Strategy

The Laravel runtime has been retired. The approved NestJS strategy is a 15-minute access JWT and rotating 7-day refresh token. Logout revokes the refresh-token family; an issued access token may remain valid until expiry. Do not reintroduce Sanctum or change this lifecycle without an explicit request.

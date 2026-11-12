
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

Expected behavior to verify against Laravel:

- USER can access their own tickets.
- SUPPORT can access all tickets.
- ADMIN can access all tickets.

Do not assume these rules apply to every resource without checking requirements.

## Token Strategy

The existing Laravel implementation uses Sanctum.

JWT is a proposed NestJS replacement, not an approved implementation decision.

Before implementation:
1. Analyze current authentication behavior.
2. Identify compatibility requirements.
3. Propose token lifecycle and expiration.
4. Explain security tradeoffs.
5. Wait for approval.

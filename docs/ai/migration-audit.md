# Laravel to NestJS Migration Audit and Retirement Record

**Status (2026-11-12):** NestJS owns the application API. All Laravel runtime code and dependencies have been removed after parity and isolated PostgreSQL E2E verification. Laravel database migration files remain as historical schema records; no existing tables or rows were deleted.

## 1. Current project state

- NestJS 12 in `nestjs/` is the active application with Prisma 7, authentication, ticket create/list, and refresh-token rotation. No Laravel runtime or `/api/*` routes remain.
- Project-specific agent guidance is in `AGENTS.md`; `.agents/skills/` has focused skills for NestJS architecture, Prisma/PostgreSQL, auth security, testing/review, and this migration.
- Laravel Composer manifests and runtime dependencies have been removed. NestJS has its own package manifest and lockfile.
- Laravel contract tests were run before runtime removal. Nest unit/API tests use mocked Prisma; a PostgreSQL E2E suite also runs in a temporary isolated schema.
- Prisma baseline and `auth_sessions` migrations are applied to the inspected loopback `helpdesk` database; migration status is current.

## 2. Laravel behavior before retirement (historical reference)

### Routes and authentication

| Method and path | Access | Observed behavior |
| --- | --- | --- |
| `POST /api/register` | Public | Validates name/email/password; creates user with role `user`; returns serialized user with HTTP 201. Does not issue a token. |
| `POST /api/login` | Public | Validates email/password; failed credentials throw 401 `Invalid credentials.`; successful login returns `token`, `token_type: Bearer`, and serialized user (default success status 200). |
| `GET /api/user` | `auth:sanctum` | Returns the authenticated user as JSON. Declared twice in `routes/api.php`; review/remove duplication only in a separately approved change. |
| `POST /api/logout` | `auth:sanctum` | Deletes the current access token and returns `{"message":"Successfully logged out."}`. |
| `POST /api/tickets` | `auth:sanctum` | Creates a ticket; policy `create` returns true; successful response is a `TicketResource`, HTTP 201. |
| `GET /api/tickets` | `auth:sanctum` | Returns a paginated `TicketResource` collection, 15 per page, newest first, with optional status/priority filters. |

All routes are API routes. `bootstrap/app.php` requests JSON exception rendering for `api/*`. Laravel validation failures should therefore be captured as JSON for these paths (normally HTTP 422); exact error body has not been asserted by project tests.

### Validation and business logic

- Registration: `name` required string, 2–255 characters; `email` required string/email, 2–255, unique in `users.email`; `password` required string, minimum 8. The registration service hashes the password and always assigns `UserRole::USER`, so client role input does not change the assigned role. Response serialization hides password and remember token, but exposes ordinary user attributes including role.
- Login: email required string/email; password required string. Authentication uses Laravel `Auth::attempt`; successful login creates a Sanctum token named `auth_token`. Sanctum expiration config is `null`; effective token lifetime and deployment-level overrides are not established by this static audit. Logout deletes only the current token.
- Ticket creation: requires title (string, max 255), description (string), and priority (enum value). Service assigns `OPEN` and associates the authenticated user. Although the DB migration gives priority a `medium` default, the API request requires a priority.
- Ticket listing: accepts optional nullable status and priority enums. `USER` role sees only own tickets. All other roles pass through without an owner filter, so current `SUPPORT` and `ADMIN` users see all tickets. Filters are applied after visibility scope, then `latest()` ordering and 15-item pagination are used. No list endpoint for users or role administration exists.
- Ticket response fields: `id`, `title`, `description`, `status`, `priority`, `user_id`, `created_at`, `updated_at`. Resource collection pagination uses Laravel's resource pagination envelope; exact serialized timestamp formatting and pagination output should be captured in parity tests.
- Roles are backed by string enum values `user`, `support`, `admin`; statuses are `open`, `in_progress`, `resolved`, `closed`; priorities are `low`, `medium`, `high`, `urgent`. Enum names in project prose use uppercase identifiers, while persisted/API values are lowercase strings.

### Authorization and middleware

- Ticket create is authorized through `TicketPolicy::create`, which unconditionally returns `true`; authentication is enforced by route middleware. Listing has no policy call and applies ownership filtering in `TicketService` only for `USER`.
- Form requests return `true` from their `authorize()` methods; they do not implement additional role checks.
- `bootstrap/app.php` contains no custom middleware registration. Policies are not explicitly registered in `AppServiceProvider`; verify Laravel's policy discovery/runtime resolution before relying on the controller authorization path in a new environment.
- No ticket view/update/delete endpoints or policies are implemented. Role CRUD or role changes are not implemented.

### Models, migrations, and comments

- `User` uses Sanctum API tokens; hides password and remember token; casts role to `UserRole`; has many tickets.
- `Ticket` casts status and priority to enums and belongs to a user. It is fillable for title, description, status, priority, and user id.
- Checked-in migrations define Laravel infrastructure tables (`users`, sessions, password resets, cache, jobs), Sanctum `personal_access_tokens`, `tickets`, and `comments`.
- `tickets`: bigint-style id, string title, text description, string status (default `open`), string priority (default `medium`), constrained `user_id` foreign key with `restrictOnDelete`, timestamps, indexes on status and priority. This is migration-file intent, not confirmation of the live PostgreSQL schema.
- Read-only PostgreSQL catalog inspection confirmed `users.role` is varchar with default `user` and a check constraint for `user`, `support`, and `admin`.
- Read-only inspection confirmed the existing Sanctum `personal_access_tokens` table. Nest uses a separate session table proposal so refresh credentials are not bearer tokens accepted by Laravel's existing guard.
- Comments are not implemented as an API or domain relationship: `Comment` is empty, and its migration creates only `id`, timestamps. There is no comment ticket/user foreign key, request, service, controller, resource, or route.

## 3. Laravel to NestJS mapping (completed)

| Laravel source | NestJS destination | Parity requirement |
| --- | --- | --- |
| `routes/api.php` | Feature module controllers and route metadata | Same paths, methods, middleware behavior, statuses |
| `AuthController` | Auth controller | Thin HTTP layer; preserve payload and status |
| `RegisterRequest`, `LoginRequest` | DTOs + validation pipe | Match required/optional rules and error behavior |
| `RegistrationService`, `AuthenticationService` | Injectable auth service(s) | Preserve user creation, hashing, token issue/revoke behavior |
| `auth:sanctum` | Auth guard/strategy + guards | Validate the same bearer credentials and reject absent/invalid tokens |
| `TicketController` | Tickets controller | Keep HTTP handling thin |
| `CreateTicketRequest`, `ListTicketsRequest` | Create/list DTOs | Match enum values, null handling, title length and response validation errors |
| `TicketService` | Tickets service + Prisma access | Preserve defaults, ownership visibility, filters, ordering, page size |
| `TicketPolicy` and service owner filter | Nest guards/policy checks/service scoping | Preserve current actual permissions; do not assume role labels mean more than code enforces |
| `TicketResource` | Explicit response mapper/serializer | Same field names, types, omissions, pagination envelope |
| Eloquent models and enums | Prisma schema/client + TypeScript enums/types | Map existing tables and physical types; preserve values and relations |
| Laravel feature contract tests (removed after retirement) | Nest unit and PostgreSQL E2E tests | Preserve the verified contract and role boundaries |
| Empty Comment model/table | No Nest comment functionality yet | Defer until a separate requirement and Laravel contract exist |

## 4. Unknowns and clarification points

1. **Deployment scope:** The inspected PostgreSQL catalog was the accessible local `helpdesk` database, not confirmation of production state. Confirm the target environment before applying schema changes.
2. **Local DB configuration:** Laravel `.env.example` defaults to SQLite while the inspected local source of truth is PostgreSQL. Nest runtime configuration uses `DATABASE_URL`.
3. **Client reauthentication:** Existing Sanctum tokens do not work as JWTs. Clients must authenticate again when pointed to Nest.
4. **Role policy intent:** Current listing grants all non-`USER` roles global ticket visibility, and creation is allowed for every authenticated role. Confirm this is intended before translating it. No explicit per-role route guards exist.
5. **Duplicate route:** Before retirement, `php artisan route:list --path=api` reported one effective `GET /api/user` route; the duplicate declarations have since been removed with the Laravel API file.
6. **Comments:** Is comment support planned? The current model/migration do not define usable comment behavior; relationships, ownership, permissions, validation, and response shape are all unspecified.
7. **User-management scope:** No user list/detail/update/delete or role assignment endpoint exists. Confirm whether role management is explicitly out of scope for the initial migration.
8. **Operational contract:** No API documentation, deployment topology, CORS/rate-limit policy, token clients, or production traffic/cutover plan was found in the inspected files.

## 5. Compatibility and safety risks

- **Shared auth storage:** Existing Sanctum personal access tokens do not become JWTs; users must reauthenticate when Nest auth is adopted. Nest bcryptjs accepted Laravel `$2y$` hashes, and PHP `password_verify` accepted a Nest `$2b$` hash in a local cross-runtime check.
- **Different physical role types:** Laravel's `enum()` migration helper may map differently across DB engines; tickets use strings rather than enum declarations. Match actual PostgreSQL schema, not only PHP enum types.
- **Prisma schema drift:** `db push` or migrations could mutate shared schema. The baseline and additive session-table migration are now applied; do not reset the database or use `db push`.
- **Authorization edge cases:** Scope checks currently distinguish only `USER` from every other role. Nest guards that implement stricter role checks could break current SUPPORT/ADMIN behavior; broader checks could leak tickets if Laravel's behavior is misunderstood.
- **Pagination/serialization drift:** Nest defaults will not automatically match Laravel resource envelopes, newest-first ordering, 15-item page size, serialization of enums/dates, or validation error format.
- **Route behavior:** `php artisan route:list --path=api` lists six effective routes, including one `GET api/user` route. Its source is the first declaration in `routes/api.php`.
- **Coverage:** Nest HTTP tests mock Prisma; the PostgreSQL E2E test covers real registration/login, refresh rotation/replay, current user, ticket creation/listing, role visibility, and logout in an isolated temporary schema.
- **Comments schema is incomplete:** Treating the empty table as a functional domain model would invent behavior and relationships.

## 6. Recommended incremental migration stages

1. **Contract baseline:** Laravel tests cover registration, login/logout, tickets, validation, authorization, filtering, and pagination. Route listing confirms the effective `/api/user` endpoint.
2. **Prisma adoption:** Baseline and additive auth-session migrations are applied; Prisma reports the schema up to date.
3. **Retirement:** Laravel runtime, framework scaffold, Composer/Vite dependencies, and PHP tests have been removed. Laravel schema migration files and shared database data remain; no database tables or rows were deleted.
4. **Comments:** No functional comments API existed in Laravel and no comments table exists; no comments behavior was added.

## 7. First migrated slice: authentication

Before retirement, Laravel contract tests passed **11 tests / 46 assertions** using isolated SQLite. Nest tests pass **16 unit/API tests** and **1 PostgreSQL E2E test**; build, lint, Prisma validation, and migration status pass. Production Nest dependencies report zero npm audit vulnerabilities.

The user approved JWT with a reauthentication cutover, 15-minute access JWTs, and rotating 7-day refresh tokens. Logout revokes the refresh family; an already-issued access JWT can remain valid until its 15-minute expiry. The baseline and session migrations are applied to the inspected loopback database. The user has said traffic cutover is not required to retire the old code.

PostgreSQL inspection confirmed the existing `users`, `tickets`, and Sanctum token structures and no `comments` table. The baseline ledger and additive `auth_sessions` migration were applied. The database reports a collation-version mismatch (database 2.43, OS 2.44); it was left unchanged.

## Verification limits

- E2E PostgreSQL checks ran against a temporary schema on the inspected loopback database, not production. Verify deployment schema state before release.
- JavaScript numbers cannot represent every PostgreSQL bigint exactly; IDs above the safe integer range remain a serialization risk.

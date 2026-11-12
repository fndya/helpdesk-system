# Helpdesk System

Helpdesk System is a REST API for user authentication and support tickets. The active backend is NestJS with TypeScript and Prisma, backed by the existing PostgreSQL database. Users can register and sign in, then create and list tickets. `USER` accounts see their own tickets; `SUPPORT` and `ADMIN` accounts see all tickets.

## Requirements

- Docker Engine with Docker Compose
- Node.js and npm

Laravel has been retired. Its migrations are kept as historical schema records; do not replay them against the shared database.

## Local setup

The repository includes a separate PostgreSQL container for local development. It listens only on `127.0.0.1:5433`, uses database `helpdesk_dev`, and stores data in a named Docker volume. It does not connect to or alter the existing `helpdesk` database.

```sh
cp -n .env.example .env.db
```

Edit `.env.db`: replace the database password placeholder in both `POSTGRES_PASSWORD` and `DATABASE_URL` with the same random 48-character hex value, and set `JWT_SECRET` to a random value of at least 32 characters. For example, generate values with `openssl rand -hex 24` and `openssl rand -base64 32`. `.env.db` is ignored by Git; never commit it.

Start the local database:

```sh
docker compose --env-file .env.db up -d postgres
```

Install and start the API, applying the checked-in Prisma migrations to this new local database on first setup:

```sh
cd nestjs
npm ci
set -a
. ../.env.db
set +a
npx prisma migrate deploy
npm run start:dev
```

The application reads environment variables directly; sourcing `.env.db` exports the database URL and JWT secret for Prisma and NestJS. It does not load a local `.env` file itself.

The API listens on `http://localhost:3000` by default. Set `PORT` to use another port. For the frontend, use `http://localhost:3000/api` as the API base URL.

Use `docker compose --env-file .env.db stop postgres` to stop the local database; its named volume keeps data between runs. Do not use `docker compose down -v` or remove the volume if you need to keep that data.

To connect the API to an existing PostgreSQL database instead, set `DATABASE_URL` to that database and skip the Compose startup. Never recreate or reset the existing database, delete its data, run `prisma db push`, or run migrations against it without explicit approval. The Prisma baseline describes the existing schema and must not be replayed as new-table SQL. See [`nestjs/README.md`](nestjs/README.md) for the existing-database migration procedure and [`AGENTS.md`](AGENTS.md) for database safety rules.

## API

All routes use the `/api` prefix.

| Method | Route | Purpose | Access |
| --- | --- | --- | --- |
| `POST` | `/api/register` | Register a user | Public |
| `POST` | `/api/login` | Sign in and receive tokens | Public |
| `POST` | `/api/refresh` | Rotate a refresh token | Public, refresh token required |
| `GET` | `/api/user` | Get the current user | Access token required |
| `POST` | `/api/logout` | Revoke the refresh-token family | Access token required |
| `POST` | `/api/tickets` | Create a ticket | Access token required |
| `GET` | `/api/tickets` | List visible tickets | Access token required |

Access tokens last 15 minutes. Refresh tokens rotate and last 7 days. Logout revokes the refresh-token family; an already-issued access token can remain valid until it expires.

## Development commands

Run these from `nestjs/`:

| Command | Purpose |
| --- | --- |
| `npm run start:dev` | Start the watch-mode API server |
| `npm test` | Run unit and API tests |
| `npm run test:e2e` | Run PostgreSQL endpoint tests against `DATABASE_URL_TEST` |
| `npm run lint` | Run Oxlint |
| `npm run build` | Build the production application |

The E2E database must be isolated from shared or production data. Set `DATABASE_URL_TEST` only to a dedicated test database/schema and prepare it using the approved migration process.

## Project layout

- `nestjs/src/auth/` — registration, login, refresh, logout, and current-user endpoints
- `nestjs/src/tickets/` — ticket creation, listing, and visibility rules
- `nestjs/src/prisma/` — PostgreSQL connection and Prisma client
- `nestjs/prisma/` — Prisma schema and migration history
- `database/migrations/` — preserved historical Laravel schema migrations; not for replay
- `docs/ai/migration-audit.md` — recorded legacy API behavior, compatibility decisions, and known risks

NestJS is organized by feature modules. Controllers handle HTTP concerns, services hold business rules, DTOs validate input, and Prisma accesses PostgreSQL. See [`nestjs/README.md`](nestjs/README.md) for additional database and test setup details.

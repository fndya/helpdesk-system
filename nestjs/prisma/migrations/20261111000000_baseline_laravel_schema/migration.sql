-- Prisma baseline for the existing Laravel-managed users and tickets tables.
-- On an existing database, mark this migration as applied; do not execute it.
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(255) NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_role_check" CHECK ("role" IN ('user', 'support', 'admin'))
);

CREATE TABLE "tickets" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" VARCHAR(255) NOT NULL DEFAULT 'open',
    "priority" VARCHAR(255) NOT NULL DEFAULT 'medium',
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_unique" ON "users"("email");
CREATE INDEX "tickets_status_index" ON "tickets"("status");
CREATE INDEX "tickets_priority_index" ON "tickets"("priority");

ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_foreign"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

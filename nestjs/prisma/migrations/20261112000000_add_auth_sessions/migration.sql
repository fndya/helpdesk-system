CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL,
    "user_id" BIGINT NOT NULL,
    "family_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "auth_sessions_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "auth_sessions_token_hash_unique" ON "auth_sessions"("token_hash");
CREATE INDEX "auth_sessions_family_id_index" ON "auth_sessions"("family_id");
CREATE INDEX "auth_sessions_user_id_index" ON "auth_sessions"("user_id");

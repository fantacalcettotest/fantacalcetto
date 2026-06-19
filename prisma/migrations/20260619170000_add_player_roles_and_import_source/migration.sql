DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlayerRole') THEN
    CREATE TYPE "PlayerRole" AS ENUM (
      'GOALKEEPER',
      'DEFENDER',
      'MIDFIELDER',
      'ATTACKER'
    );
  END IF;
END
$$;

ALTER TABLE "Player"
ADD COLUMN "externalId" TEXT,
ADD COLUMN "role" "PlayerRole" NOT NULL DEFAULT 'MIDFIELDER',
ADD COLUMN "source" TEXT;

CREATE UNIQUE INDEX "Player_source_externalId_key"
ON "Player"("source", "externalId");

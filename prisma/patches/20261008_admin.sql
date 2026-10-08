BEGIN;
CREATE TABLE IF NOT EXISTS "AdminAudit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorId" TEXT NOT NULL,
  "actorName" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "details" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AdminAudit_createdAt_idx" ON "AdminAudit"("createdAt");
CREATE INDEX IF NOT EXISTS "AdminAudit_entityId_createdAt_idx" ON "AdminAudit"("entityId", "createdAt");
ALTER TABLE "AdminAudit" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "AdminAudit" FROM anon, authenticated;
COMMIT;

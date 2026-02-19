-- AlterTable
ALTER TABLE "UserWord" ADD COLUMN IF NOT EXISTS "category" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserWord_category_idx" ON "UserWord"("category");


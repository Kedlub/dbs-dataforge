-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "internalNotes" TEXT;

-- CreateIndex
CREATE INDEX "reservations_activity_id_idx" ON "reservations"("activity_id");

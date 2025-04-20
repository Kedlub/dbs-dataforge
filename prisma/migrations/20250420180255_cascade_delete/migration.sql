-- DropForeignKey
ALTER TABLE "facility_activities" DROP CONSTRAINT "facility_activities_activity_id_fkey";

-- DropForeignKey
ALTER TABLE "facility_activities" DROP CONSTRAINT "facility_activities_facility_id_fkey";

-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_activity_id_fkey";

-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_slot_id_fkey";

-- DropForeignKey
ALTER TABLE "time_slots" DROP CONSTRAINT "time_slots_facility_id_fkey";

-- AddForeignKey
ALTER TABLE "facility_activities" ADD CONSTRAINT "facility_activities_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_activities" ADD CONSTRAINT "facility_activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "time_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

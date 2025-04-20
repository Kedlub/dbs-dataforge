-- CreateIndex
CREATE INDEX "employee_shifts_employee_id_idx" ON "employee_shifts"("employee_id");

-- CreateIndex
CREATE INDEX "reservations_user_id_idx" ON "reservations"("user_id");

-- CreateIndex
CREATE INDEX "reservations_slot_id_idx" ON "reservations"("slot_id");

-- CreateIndex
CREATE INDEX "time_slots_facility_id_idx" ON "time_slots"("facility_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

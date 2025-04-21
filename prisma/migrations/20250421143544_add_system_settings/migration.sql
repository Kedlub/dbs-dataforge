-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "default_opening_hour" INTEGER NOT NULL DEFAULT 8,
    "default_closing_hour" INTEGER NOT NULL DEFAULT 22,
    "max_booking_lead_days" INTEGER NOT NULL DEFAULT 30,
    "cancellation_deadline_hours" INTEGER NOT NULL DEFAULT 24,
    "max_active_reservations_per_user" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

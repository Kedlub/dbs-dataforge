-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "column_name" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_table_name_record_id_idx" ON "audit_logs"("table_name", "record_id");

-- Function to log facility status changes
CREATE OR REPLACE FUNCTION log_facility_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the 'status' column was updated
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO audit_logs (table_name, record_id, column_name, old_value, new_value)
        VALUES ('facilities', OLD.id::text, 'status', OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the log function after facility status update
CREATE TRIGGER trg_facility_status_change
AFTER UPDATE ON facilities
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status) -- Only run if status actually changes
EXECUTE FUNCTION log_facility_status_change();

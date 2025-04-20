-- This is an empty migration.

-- Add custom database functions below

-- Function to calculate revenue for a facility within a date range
CREATE OR REPLACE FUNCTION calculate_facility_revenue(
    p_facility_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS DECIMAL AS $$
DECLARE
    total_revenue DECIMAL;
BEGIN
    SELECT COALESCE(SUM(r.total_price), 0.00)
    INTO total_revenue
    FROM reservations r
    JOIN time_slots ts ON r.slot_id = ts.id
    WHERE ts.facility_id = p_facility_id
      AND r.status = 'confirmed' -- Consider only confirmed reservations for revenue
      AND ts.start_time >= p_start_date::timestamp
      AND ts.start_time < (p_end_date + interval '1 day')::timestamp;

    RETURN total_revenue;
END;
$$ LANGUAGE plpgsql;

-- Function to check the count of active (future) reservations for a user
CREATE OR REPLACE FUNCTION check_user_active_reservations(
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    active_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO active_count
    FROM reservations r
    JOIN time_slots ts ON r.slot_id = ts.id
    WHERE r.user_id = p_user_id
      AND r.status IN ('confirmed', 'pending') -- Active statuses
      AND ts.start_time >= NOW(); -- Only future reservations

    RETURN active_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get a summary text of facility availability for a specific date
CREATE OR REPLACE FUNCTION get_facility_availability_summary(
    p_facility_id UUID,
    p_check_date DATE
)
RETURNS TEXT AS $$
DECLARE
    facility_name TEXT;
    total_slots INTEGER;
    available_slots INTEGER;
    summary TEXT;
BEGIN
    -- Get facility name (add explicit cast)
    SELECT name INTO facility_name FROM facilities WHERE id::uuid = p_facility_id;

    IF NOT FOUND THEN
        RETURN 'Sportoviště nenalezeno.';
    END IF;

    -- Count total slots starting on the given date (add explicit cast)
    SELECT COUNT(*)
    INTO total_slots
    FROM time_slots ts
    WHERE ts.facility_id::uuid = p_facility_id
      AND ts.start_time >= p_check_date::timestamp
      AND ts.start_time < (p_check_date + interval '1 day')::timestamp;

    -- Count available slots starting on the given date (add explicit cast)
    SELECT COUNT(*)
    INTO available_slots
    FROM time_slots ts
    WHERE ts.facility_id::uuid = p_facility_id
      AND ts.start_time >= p_check_date::timestamp
      AND ts.start_time < (p_check_date + interval '1 day')::timestamp
      AND ts.is_available = TRUE;

    -- Format the summary string in Czech (without facility name)
    summary := available_slots::TEXT || '/' || total_slots::TEXT || ' slotů volných dne ' || to_char(p_check_date, 'DD.MM.YYYY');

    RETURN summary;
END;
$$ LANGUAGE plpgsql;
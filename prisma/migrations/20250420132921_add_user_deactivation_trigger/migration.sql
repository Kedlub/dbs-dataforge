-- This is an empty migration.

-- Function to cancel future reservations for a deactivated user
CREATE OR REPLACE FUNCTION cancel_user_future_reservations()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the 'is_active' column was updated from true to false
    IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
        -- Update future reservations to 'cancelled'
        UPDATE reservations
        SET status = 'cancelled', cancellation_reason = 'User deactivated'
        WHERE user_id = OLD.id
          AND status IN ('confirmed', 'pending')
          AND slot_id IN (SELECT id FROM time_slots WHERE start_time > NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the cancellation function after user deactivation
CREATE TRIGGER trg_user_deactivation
AFTER UPDATE ON users
FOR EACH ROW
WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active AND NEW.is_active = FALSE) -- Only run if deactivated
EXECUTE FUNCTION cancel_user_future_reservations();
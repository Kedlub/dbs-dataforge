-- This is an empty migration.

-- Stored procedure to cancel a reservation and update its status/reason.
CREATE OR REPLACE PROCEDURE cancel_reservation(
    p_reservation_id TEXT,
    p_cancellation_reason TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE reservations
    SET status = 'cancelled',
        cancellation_reason = p_cancellation_reason,
        last_modified = NOW()
    WHERE reservation_id = p_reservation_id;

    -- Potential Enhancement: Consider making the associated TimeSlot available again.
    -- UPDATE time_slots SET is_available = true WHERE slot_id = (SELECT slot_id FROM reservations WHERE reservation_id = p_reservation_id);
END;
$$;

-- Stored procedure to deactivate a user.
CREATE OR REPLACE PROCEDURE deactivate_user(
    p_user_id TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE users
    SET is_active = false
    WHERE id = p_user_id;

    -- Potential Enhancement: Cancel future active reservations for the deactivated user.
    -- CALL cancel_reservation(res.reservation_id, 'User deactivated')
    -- FROM reservations res
    -- WHERE res.user_id = p_user_id AND res.status IN ('confirmed', 'pending') AND (SELECT start_time FROM time_slots WHERE slot_id = res.slot_id) > NOW();
END;
$$;

-- Stored procedure to assign a new shift to an employee.
CREATE OR REPLACE PROCEDURE assign_employee_shift(
    p_employee_id TEXT,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_shift_type TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO employee_shifts (shift_id, employee_id, start_time, end_time, shift_type)
    VALUES (gen_random_uuid()::text, p_employee_id, p_start_time, p_end_time, p_shift_type);
END;
$$;
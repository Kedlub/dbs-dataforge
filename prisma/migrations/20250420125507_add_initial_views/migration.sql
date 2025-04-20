-- View for detailed user reservations
CREATE VIEW vw_user_reservations AS
SELECT
    r.id as reservation_id,
    u.id as user_id,
    u.username,
    u.first_name,
    u.last_name,
    a.name as activity_name,
    f.name as facility_name,
    ts.start_time,
    ts.end_time,
    r.status as reservation_status,
    r.total_price,
    r.created_at as reservation_created_at
FROM reservations r
JOIN users u ON r.user_id = u.id
JOIN activities a ON r.activity_id = a.id
JOIN time_slots ts ON r.slot_id = ts.id
JOIN facilities f ON ts.facility_id = f.id;

-- View for facility schedule
CREATE VIEW vw_facility_schedule AS
SELECT
    f.id as facility_id,
    f.name as facility_name,
    ts.id as time_slot_id,
    ts.start_time,
    ts.end_time,
    ts.is_available,
    r.id as reservation_id, -- Included to show if the slot is booked
    a.name as activity_name -- Included to show what activity is booked
FROM facilities f
JOIN time_slots ts ON f.id = ts.facility_id
LEFT JOIN reservations r ON ts.id = r.slot_id AND r.status != 'cancelled' -- Join only non-cancelled reservations
LEFT JOIN activities a ON r.activity_id = a.id;

-- View for employee schedule
CREATE VIEW vw_employee_schedule AS
SELECT
    es.id as shift_id,
    e.id as employee_id,
    u.first_name,
    u.last_name,
    e.position,
    es.start_time,
    es.end_time,
    es.shift_type
FROM employee_shifts es
JOIN employees e ON es.employee_id = e.id
JOIN users u ON e.user_id = u.id;
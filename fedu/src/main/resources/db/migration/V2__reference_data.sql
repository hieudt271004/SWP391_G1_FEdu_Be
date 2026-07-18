-- =====================================================================
-- V2 — Dữ liệu tham chiếu bắt buộc để app hoạt động: roles, học kỳ, ca học.
-- Viết dạng idempotent (ON CONFLICT DO NOTHING) nên chạy an toàn trên cả
-- database đã có sẵn dữ liệu (Neon / DB dev) lẫn database mới.
-- =====================================================================

INSERT INTO roles (role_id, role_name, created_at, updated_at) VALUES
  (1, 'ADMIN',   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, 'TEACHER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3, 'STUDENT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (4, 'USER',    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO semesters (semester_id, term, academic_year, start_date, end_date) VALUES
  (1,  'SPRING', 2025, '2025-01-01', '2025-04-30'),
  (2,  'SUMMER', 2025, '2025-05-01', '2025-08-31'),
  (3,  'FALL',   2025, '2025-09-01', '2025-12-31'),
  (4,  'SPRING', 2026, '2026-01-01', '2026-04-30'),
  (5,  'SUMMER', 2026, '2026-05-01', '2026-08-31'),
  (6,  'FALL',   2026, '2026-09-01', '2026-12-31'),
  (7,  'SPRING', 2027, '2027-01-01', '2027-04-30'),
  (8,  'SUMMER', 2027, '2027-05-01', '2027-08-31'),
  (9,  'FALL',   2027, '2027-09-01', '2027-12-31'),
  (10, 'SPRING', 2028, '2028-01-01', '2028-04-30'),
  (11, 'SUMMER', 2028, '2028-05-01', '2028-08-31'),
  (12, 'FALL',   2028, '2028-09-01', '2028-12-31')
ON CONFLICT DO NOTHING;

INSERT INTO slots (slot_id, slot_name, start_time, end_time) VALUES
  (1, 'Slot 1', '07:00', '09:15'),
  (2, 'Slot 2', '09:30', '11:45'),
  (3, 'Slot 3', '12:30', '14:45'),
  (4, 'Slot 4', '15:00', '17:15'),
  (5, 'Slot 5', '17:30', '19:45'),
  (6, 'Slot 6', '19:45', '21:15')
ON CONFLICT DO NOTHING;

-- Đồng bộ sequence sau khi chèn ID tường minh
SELECT setval(pg_get_serial_sequence('public.roles', 'role_id'),         GREATEST((SELECT MAX(role_id)     FROM roles),     1));
SELECT setval(pg_get_serial_sequence('public.semesters', 'semester_id'), GREATEST((SELECT MAX(semester_id) FROM semesters), 1));
SELECT setval(pg_get_serial_sequence('public.slots', 'slot_id'),         GREATEST((SELECT MAX(slot_id)     FROM slots),     1));

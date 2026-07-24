-- =====================================================================
-- V3 — Chuẩn hóa quan hệ classroom ↔ semester.
-- Trước: classrooms lưu term + academic_year (denormalized, không FK) →
--        không có toàn vẹn tham chiếu, ERD không nối được về semesters.
-- Sau:   classrooms.semester_id → semesters(semester_id) (FK thật).
-- =====================================================================

-- 1. Thêm cột khóa ngoại (nullable để migrate an toàn với dữ liệu cũ chưa khớp).
ALTER TABLE public.classrooms ADD COLUMN IF NOT EXISTS semester_id bigint;

-- 2. Backfill: khớp lớp học cũ với học kỳ đã cấu hình theo (term, academic_year).
UPDATE public.classrooms c
SET semester_id = s.semester_id
FROM public.semesters s
WHERE c.term = s.term
  AND c.academic_year = s.academic_year
  AND c.semester_id IS NULL;

-- 3. Ràng buộc khóa ngoại — RESTRICT: không cho xóa học kỳ đang được lớp học sử dụng.
ALTER TABLE public.classrooms
    ADD CONSTRAINT classrooms_semester_id_fkey
    FOREIGN KEY (semester_id) REFERENCES public.semesters(semester_id) ON DELETE RESTRICT;

-- 4. Gỡ các cột denormalized cũ (term, academic_year) và cột semester legacy không dùng.
ALTER TABLE public.classrooms DROP COLUMN IF EXISTS term;
ALTER TABLE public.classrooms DROP COLUMN IF EXISTS academic_year;
ALTER TABLE public.classrooms DROP COLUMN IF EXISTS semester;

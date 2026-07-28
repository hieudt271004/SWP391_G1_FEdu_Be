-- =====================================================================
-- Seed dữ liệu DEMO — chỉ được nạp khi chạy profile "demo"
-- (spring.flyway.locations có thêm classpath:db/demo).
--
-- Đây là Flyway afterMigrate callback (không ghi vào lịch sử migration),
-- chạy sau mỗi lần migrate nhưng có GUARD: nếu database đã có người dùng
-- thì bỏ qua toàn bộ — nên an toàn khi lỡ trỏ vào DB đang có dữ liệu,
-- và boot lại nhiều lần không nhân đôi dữ liệu.
--
-- Tài khoản demo (mật khẩu đều là 123456):
--   admin@gmail.com / teacher@fedu.vn / student1@fedu.vn / student2@fedu.vn
-- Kèm: 2 môn published (JAVA101, WEB201) mỗi môn 1 lộ trình mẫu đầy đủ
-- 9 chặng (PLACEMENT, 3 mức, GATE, FREE_CHOICE, ON_CLASS + học liệu + quiz);
-- lớp SE1801 (SUMMER 2026) với 2 lớp-môn, 2 học sinh ghi danh cả hai.
-- =====================================================================
DO $$
BEGIN

IF EXISTS (SELECT 1 FROM user_account) THEN
  RAISE NOTICE 'Demo seed: database da co nguoi dung — bo qua.';
  RETURN;
END IF;

RAISE NOTICE 'Demo seed: database trong — nap du lieu demo...';

-- ---------------------------------------------------------------------
-- 1. Tài khoản (mật khẩu '123456', mã hoá BCrypt)
-- ---------------------------------------------------------------------
INSERT INTO user_account (user_id, email, password, last_name, first_name, gender, bod, phone, status, is_deleted, created_at, updated_at) VALUES
  (1, 'admin@gmail.com',  '$2a$10$b.qmjg0CytZ8cCk.3/Bsquy3QekOl0siRDrR96Xap95StcDgN2SKO', 'Admin',      'System', 'MALE',   '1990-01-01', '0900000001', 'ACTIVE', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, 'teacher@fedu.vn',  '$2a$10$b.qmjg0CytZ8cCk.3/Bsquy3QekOl0siRDrR96Xap95StcDgN2SKO', 'Nguyễn Văn', 'Minh',   'MALE',   '1988-09-15', '0900000002', 'ACTIVE', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3, 'student1@fedu.vn', '$2a$10$b.qmjg0CytZ8cCk.3/Bsquy3QekOl0siRDrR96Xap95StcDgN2SKO', 'Trần Thị',   'Lan',    'FEMALE', '2005-03-20', '0900000003', 'ACTIVE', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (4, 'student2@fedu.vn', '$2a$10$b.qmjg0CytZ8cCk.3/Bsquy3QekOl0siRDrR96Xap95StcDgN2SKO', 'Lê Đức',     'Hùng',   'MALE',   '2005-11-02', '0900000004', 'ACTIVE', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO user_role (user_role_id, user_id, role_id) VALUES
  (1, 1, 1),
  (2, 2, 2),
  (3, 3, 3),
  (4, 4, 3);

-- ---------------------------------------------------------------------
-- 2. Môn học, lớp, lớp-môn, ghi danh học sinh
-- ---------------------------------------------------------------------
INSERT INTO subjects (subject_id, subject_code, subject_name, description, status, learningpath_length, created_by, is_deleted, created_at, updated_at) VALUES
  (1, 'JAVA101', 'Lập trình Java cơ bản',   'Nhập môn lập trình Java: cú pháp, OOP, cấu trúc dữ liệu cơ bản.', 'published', 9, 1, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, 'WEB201',  'Phát triển Web Frontend', 'HTML, CSS, JavaScript và các kỹ thuật xây dựng giao diện web.',   'published', 9, 1, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO classrooms (classroom_id, class_name, description, status, term, academic_year, is_deleted, created_at, updated_at) VALUES
  (1, 'SE1801', 'Lớp demo dành cho giáo viên trải nghiệm hệ thống', 'active', 'SUMMER', 2026, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO classroom_subjects (id, classroom_id, subject_id, lecturer_id, id_quiz_start, created_at, updated_at) VALUES
  (1, 1, 1, 2, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, 1, 2, 2, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO classroom_subject_students (id, classroom_subject_id, student_id, joined_at, current_level, is_submentor, created_at, updated_at) VALUES
  (1, 1, 3, CURRENT_TIMESTAMP, NULL, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, 1, 4, CURRENT_TIMESTAMP, NULL, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3, 2, 3, CURRENT_TIMESTAMP, NULL, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (4, 2, 4, CURRENT_TIMESTAMP, NULL, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ---------------------------------------------------------------------
-- 3. Lộ trình mẫu (template, classroom_subject_id = NULL)
-- Cấu trúc 9 chặng / lộ trình:
--   1: PLACEMENT  → 2: bài chung → 3: 3 mức → 4: ON_CLASS → 5: 3 mức + 2 GATE
--   → 6: 3 mức → 7: 3 FREE_CHOICE → 8: 3 mức → 9: ON_CLASS tổng kết
-- ---------------------------------------------------------------------
INSERT INTO learning_paths (path_id, path_name, description, subject_id, classroom_subject_id, created_by, is_deleted, created_at, updated_at) VALUES
  (1, 'Lộ trình mẫu', 'Lộ trình mẫu đầy đủ cho môn Lập trình Java cơ bản',   1, NULL, 2, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, 'Lộ trình mẫu', 'Lộ trình mẫu đầy đủ cho môn Phát triển Web Frontend', 2, NULL, 2, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Node của lộ trình 1 (JAVA101): node_id 1..21
INSERT INTO learning_nodes (node_id, path_id, title, description, node_type, node_status, display_order, is_required, stage_order, level, test_kind, applies_levels, gate_up_min, gate_down_max, placement_yeu_max, placement_tb_max, is_deleted, created_at, updated_at) VALUES
  (1,  1, 'Bài test phân loại đầu vào',      'Xác định mức ban đầu: Yếu / Trung bình / Khá', 'AT_HOME',  'LOCKED', 0, true, 1, NULL, 'PLACEMENT',   '1,2,3', NULL,  NULL,  49.00, 79.00, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2,  1, 'Giới thiệu môn học',              'Tổng quan môn học và cách sử dụng lộ trình',   'AT_HOME',  'LOCKED', 0, true, 2, NULL, 'NONE',        NULL,    NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3,  1, 'Chương 1 (Yếu)',                  'Biến, kiểu dữ liệu, toán tử — mức Yếu',        'AT_HOME',  'LOCKED', 0, true, 3, 1,    'NONE',        NULL,    NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (4,  1, 'Chương 1 (Trung bình)',           'Biến, kiểu dữ liệu, toán tử — mức Trung bình', 'AT_HOME',  'LOCKED', 0, true, 3, 2,    'NONE',        NULL,    NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (5,  1, 'Chương 1 (Khá)',                  'Biến, kiểu dữ liệu, toán tử — mức Khá',        'AT_HOME',  'LOCKED', 0, true, 3, 3,    'NONE',        NULL,    NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (6,  1, 'Buổi học trên lớp 1',             'Buổi học chung cả lớp',                        'ON_CLASS', 'LOCKED', 0, true, 4, NULL, 'NONE',        NULL,    NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (7,  1, 'Chương 2 (Yếu)',                  'Cấu trúc điều khiển — mức Yếu',                'AT_HOME',  'LOCKED', 0, true, 5, 1,    'NONE',        NULL,    NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (8,  1, 'Chương 2 (Trung bình)',           'Cấu trúc điều khiển — mức Trung bình',         'AT_HOME',  'LOCKED', 0, true, 5, 2,    'NONE',        NULL,    NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (9,  1, 'Chương 2 (Khá)',                  'Cấu trúc điều khiển — mức Khá',                'AT_HOME',  'LOCKED', 0, true, 5, 3,    'NONE',        NULL,    NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (10, 1, 'Bài test giữa chặng (Yếu–TB)',    'GATE cho mức Yếu và Trung bình',               'AT_HOME',  'LOCKED', 0, true, 5, NULL, 'GATE',        '1,2',   80.00, 49.00, NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (11, 1, 'Bài test giữa chặng (Khá)',       'GATE cho mức Khá',                             'AT_HOME',  'LOCKED', 0, true, 5, 3,    'GATE',        '3',     80.00, 49.00, NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (12, 1, 'Chương 3 (Yếu)',                  'Mảng và chuỗi — mức Yếu',                      'AT_HOME',  'LOCKED', 0, true, 6, 1,    'NONE',        NULL,    NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (13, 1, 'Chương 3 (Trung bình)',           'Mảng và chuỗi — mức Trung bình',               'AT_HOME',  'LOCKED', 0, true, 6, 2,    'NONE',        NULL,    NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (14, 1, 'Chương 3 (Khá)',                  'Mảng và chuỗi — mức Khá',                      'AT_HOME',  'LOCKED', 0, true, 6, 3,    'NONE',        NULL,    NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (15, 1, 'Test tự chọn – mức Yếu',          'FREE_CHOICE: thi để đổi sang mức Yếu',         'AT_HOME',  'LOCKED', 0, true, 7, 1,    'FREE_CHOICE', '1',     NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (16, 1, 'Test tự chọn – mức Trung bình',   'FREE_CHOICE: thi để đổi sang mức Trung bình',  'AT_HOME',  'LOCKED', 0, true, 7, 2,    'FREE_CHOICE', '2',     NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (17, 1, 'Test tự chọn – mức Khá',          'FREE_CHOICE: thi để đổi sang mức Khá',         'AT_HOME',  'LOCKED', 0, true, 7, 3,    'FREE_CHOICE', '3',     NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (18, 1, 'Chương 4 (Yếu)',                  'OOP cơ bản — mức Yếu',                         'AT_HOME',  'LOCKED', 0, true, 8, 1,    'NONE',        NULL,    NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (19, 1, 'Chương 4 (Trung bình)',           'OOP cơ bản — mức Trung bình',                  'AT_HOME',  'LOCKED', 0, true, 8, 2,    'NONE',        NULL,    NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (20, 1, 'Chương 4 (Khá)',                  'OOP cơ bản — mức Khá',                         'AT_HOME',  'LOCKED', 0, true, 8, 3,    'NONE',        NULL,    NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (21, 1, 'Buổi tổng kết trên lớp',          'Buổi học chung tổng kết môn',                  'ON_CLASS', 'LOCKED', 0, true, 9, NULL, 'NONE',        NULL,    NULL,  NULL,  NULL,  NULL,  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Node của lộ trình 2 (WEB201): copy cấu trúc lộ trình 1, node_id = +100
INSERT INTO learning_nodes (node_id, path_id, title, description, node_type, node_status, display_order, is_required, stage_order, level, test_kind, applies_levels, gate_up_min, gate_down_max, placement_yeu_max, placement_tb_max, is_deleted, created_at, updated_at)
SELECT node_id + 100, 2, title, description, node_type, node_status, display_order, is_required, stage_order, level, test_kind, applies_levels, gate_up_min, gate_down_max, placement_yeu_max, placement_tb_max, is_deleted, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM learning_nodes WHERE path_id = 1;

-- Cạnh của lộ trình 1: edge_id 1..31 (mẫu nối giống trình chỉnh sửa lộ trình tạo ra)
INSERT INTO node_edges (edge_id, from_node_id, to_node_id, created_at) VALUES
  (1,  1,  2,  CURRENT_TIMESTAMP),
  (2,  2,  3,  CURRENT_TIMESTAMP), (3,  2,  4,  CURRENT_TIMESTAMP), (4,  2,  5,  CURRENT_TIMESTAMP),
  (5,  3,  6,  CURRENT_TIMESTAMP), (6,  4,  6,  CURRENT_TIMESTAMP), (7,  5,  6,  CURRENT_TIMESTAMP),
  (8,  6,  7,  CURRENT_TIMESTAMP), (9,  6,  8,  CURRENT_TIMESTAMP), (10, 6,  9,  CURRENT_TIMESTAMP),
  (11, 7,  10, CURRENT_TIMESTAMP), (12, 8,  10, CURRENT_TIMESTAMP), (13, 9,  11, CURRENT_TIMESTAMP),
  (14, 10, 12, CURRENT_TIMESTAMP), (15, 10, 13, CURRENT_TIMESTAMP), (16, 11, 14, CURRENT_TIMESTAMP),
  (17, 12, 15, CURRENT_TIMESTAMP), (18, 12, 16, CURRENT_TIMESTAMP), (19, 12, 17, CURRENT_TIMESTAMP),
  (20, 13, 15, CURRENT_TIMESTAMP), (21, 13, 16, CURRENT_TIMESTAMP), (22, 13, 17, CURRENT_TIMESTAMP),
  (23, 14, 15, CURRENT_TIMESTAMP), (24, 14, 16, CURRENT_TIMESTAMP), (25, 14, 17, CURRENT_TIMESTAMP),
  (26, 15, 18, CURRENT_TIMESTAMP), (27, 16, 19, CURRENT_TIMESTAMP), (28, 17, 20, CURRENT_TIMESTAMP),
  (29, 18, 21, CURRENT_TIMESTAMP), (30, 19, 21, CURRENT_TIMESTAMP), (31, 20, 21, CURRENT_TIMESTAMP);

-- Cạnh của lộ trình 2: edge_id = +100, node = +100
INSERT INTO node_edges (edge_id, from_node_id, to_node_id, created_at)
SELECT edge_id + 100, from_node_id + 100, to_node_id + 100, CURRENT_TIMESTAMP
FROM node_edges WHERE edge_id <= 31;

-- ---------------------------------------------------------------------
-- 4. Học liệu (material + video) cho các node bài học AT_HOME
-- material_id = node_id tương ứng; video_id = material_id
-- ---------------------------------------------------------------------
INSERT INTO node_materials (material_id, node_id, title, required, order_index, is_deleted, created_at, updated_at)
SELECT node_id, node_id, 'Video bài giảng: ' || title, true, 1, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM learning_nodes
WHERE test_kind = 'NONE' AND node_type = 'AT_HOME' AND path_id IN (1, 2);

INSERT INTO videos (video_id, material_id, title, description, video_url, is_deleted, created_at, updated_at)
SELECT m.material_id, m.material_id, m.title, 'Video bài giảng demo',
       CASE WHEN n.path_id = 1
            THEN 'https://www.youtube.com/watch?v=A74TOX803D0'  -- Java course (freeCodeCamp)
            ELSE 'https://www.youtube.com/watch?v=G3e-cpL7ofc'  -- HTML/CSS course (freeCodeCamp)
       END,
       false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM node_materials m JOIN learning_nodes n ON n.node_id = m.node_id;

-- ---------------------------------------------------------------------
-- 5. Bài test gắn vào node PLACEMENT / GATE / FREE_CHOICE
-- Lộ trình 1: test_id 1..6 — Lộ trình 2: test_id 11..16
-- question_id = test_id*10 + i — answer_id = question_id*10 + j
-- ---------------------------------------------------------------------
INSERT INTO tests (test_id, node_id, title, description, duration_minutes, passing_percentage, test_kind, released_at, is_deleted, created_at, updated_at) VALUES
  (1,  1,   'Bài test phân loại đầu vào — JAVA101', 'Phân loại mức ban đầu',        10, 0.00,   'NORMAL', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2,  10,  'Bài test giữa chặng (Yếu–TB) — JAVA101', 'GATE: ≥80 lên mức, ≤49 xuống mức', 10, 0.00,   'NORMAL', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3,  11,  'Bài test giữa chặng (Khá) — JAVA101',  'GATE cho mức Khá',             10, 0.00,   'NORMAL', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (4,  15,  'Test tự chọn mức Yếu — JAVA101',       'FREE_CHOICE, cần đạt 100%',    10, 100.00, 'NORMAL', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (5,  16,  'Test tự chọn mức Trung bình — JAVA101','FREE_CHOICE, cần đạt 100%',    10, 100.00, 'NORMAL', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (6,  17,  'Test tự chọn mức Khá — JAVA101',       'FREE_CHOICE, cần đạt 100%',    10, 100.00, 'NORMAL', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (11, 101, 'Bài test phân loại đầu vào — WEB201',  'Phân loại mức ban đầu',        10, 0.00,   'NORMAL', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (12, 110, 'Bài test giữa chặng (Yếu–TB) — WEB201','GATE: ≥80 lên mức, ≤49 xuống mức', 10, 0.00,   'NORMAL', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (13, 111, 'Bài test giữa chặng (Khá) — WEB201',   'GATE cho mức Khá',             10, 0.00,   'NORMAL', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (14, 115, 'Test tự chọn mức Yếu — WEB201',        'FREE_CHOICE, cần đạt 100%',    10, 100.00, 'NORMAL', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (15, 116, 'Test tự chọn mức Trung bình — WEB201', 'FREE_CHOICE, cần đạt 100%',    10, 100.00, 'NORMAL', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (16, 117, 'Test tự chọn mức Khá — WEB201',        'FREE_CHOICE, cần đạt 100%',    10, 100.00, 'NORMAL', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ===== Câu hỏi JAVA101 =====
INSERT INTO test_questions (question_id, test_id, question_content, question_type, score, created_at, updated_at) VALUES
  (11, 1, 'JDK là viết tắt của cụm từ nào?',                              'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (12, 1, 'Từ khóa nào dùng để khai báo hằng số trong Java?',             'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (13, 1, 'Kiểu dữ liệu nào dùng để lưu số nguyên trong Java?',           'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (14, 1, 'Vòng lặp nào luôn chạy ít nhất một lần?',                      'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (15, 1, 'Chữ ký chuẩn của phương thức main là gì?',                     'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (21, 2, 'Toán tử == so sánh gì khi dùng với kiểu đối tượng?',           'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (22, 2, 'Chỉ số của mảng trong Java bắt đầu từ số mấy?',                'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (23, 2, 'Từ khóa new dùng để làm gì?',                                  'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (31, 3, 'Tính chất nào sau đây KHÔNG thuộc lập trình hướng đối tượng?', 'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (32, 3, 'Trước Java 8, interface chỉ được chứa loại phương thức nào?',  'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (33, 3, 'Từ khóa extends dùng trong trường hợp nào?',                   'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (41, 4, 'Lệnh nào in một dòng chữ ra màn hình console?',                'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (42, 4, 'Giá trị mặc định của biến kiểu boolean là gì?',                'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (43, 4, 'Toán tử % (chia lấy dư) của 10 % 3 cho kết quả nào?',          'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (51, 5, 'Phương thức nào dùng để so sánh nội dung hai chuỗi?',          'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (52, 5, 'ArrayList khác mảng thường ở điểm nào?',                       'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (53, 5, 'Từ khóa static có ý nghĩa gì?',                                'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (61, 6, 'Đa hình (polymorphism) trong Java thể hiện qua cơ chế nào?',   'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (62, 6, 'Khối try-with-resources dùng để làm gì?',                      'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (63, 6, 'HashMap cho phép key null không?',                             'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO test_answers (answer_id, question_id, answer_content, is_correct, created_at, updated_at) VALUES
  (111, 11, 'Java Development Kit', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (112, 11, 'Java Deployment Kit',  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (113, 11, 'Java Data Kit',        false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (114, 11, 'Java Design Kit',      false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (121, 12, 'final',  true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (122, 12, 'const',  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (123, 12, 'static', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (124, 12, 'let',    false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (131, 13, 'int',     true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (132, 13, 'float',   false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (133, 13, 'boolean', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (134, 13, 'String',  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (141, 14, 'do-while', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (142, 14, 'while',    false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (143, 14, 'for',      false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (144, 14, 'foreach',  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (151, 15, 'public static void main(String[] args)', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (152, 15, 'public void main(String[] args)',        false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (153, 15, 'static main(String args)',               false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (154, 15, 'void main()',                            false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (211, 21, 'So sánh tham chiếu (địa chỉ ô nhớ)', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (212, 21, 'So sánh nội dung',                   false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (213, 21, 'So sánh kiểu dữ liệu',               false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (214, 21, 'So sánh độ dài',                     false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (221, 22, '0',            true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (222, 22, '1',            false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (223, 22, '-1',           false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (224, 22, 'Tùy khai báo', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (231, 23, 'Tạo một đối tượng mới',      true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (232, 23, 'Khai báo biến mới',          false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (233, 23, 'Tạo một package mới',        false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (234, 23, 'Import một thư viện',        false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (311, 31, 'Compilation',   true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (312, 31, 'Encapsulation', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (313, 31, 'Inheritance',   false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (314, 31, 'Polymorphism',  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (321, 32, 'Phương thức trừu tượng (abstract)', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (322, 32, 'Phương thức có thân đầy đủ',        false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (323, 32, 'Phương thức private',               false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (324, 32, 'Constructor',                       false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (331, 33, 'Kế thừa một lớp khác',        true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (332, 33, 'Cài đặt một interface',       false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (333, 33, 'Tạo đối tượng',               false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (334, 33, 'Bắt ngoại lệ',                false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (411, 41, 'System.out.println("...")', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (412, 41, 'console.log("...")',        false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (413, 41, 'print("...")',              false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (414, 41, 'echo "..."',                false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (421, 42, 'false', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (422, 42, 'true',  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (423, 42, '0',     false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (424, 42, 'null',  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (431, 43, '1', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (432, 43, '3', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (433, 43, '0', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (434, 43, '10', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (511, 51, 'equals()',      true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (512, 51, 'toán tử ==',    false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (513, 51, 'compareSize()', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (514, 51, 'match()',       false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (521, 52, 'Kích thước thay đổi động được',  true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (522, 52, 'Chỉ lưu được kiểu int',          false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (523, 52, 'Truy cập phần tử nhanh hơn mảng',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (524, 52, 'Không khác gì',                  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (531, 53, 'Thuộc về lớp, dùng chung cho mọi đối tượng', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (532, 53, 'Không thể thay đổi giá trị',                 false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (533, 53, 'Chỉ dùng trong vòng lặp',                    false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (534, 53, 'Tự động giải phóng bộ nhớ',                  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (611, 61, 'Ghi đè (override) phương thức khi kế thừa', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (612, 61, 'Khai báo biến static',                      false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (613, 61, 'Dùng vòng lặp for-each',                    false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (614, 61, 'Bắt ngoại lệ bằng try-catch',               false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (621, 62, 'Tự động đóng tài nguyên sau khi dùng xong', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (622, 62, 'Tăng tốc độ thực thi',                      false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (623, 62, 'Bỏ qua mọi ngoại lệ',                       false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (624, 62, 'Khai báo nhiều biến cùng lúc',              false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (631, 63, 'Có, tối đa một key null',   true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (632, 63, 'Không bao giờ',             false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (633, 63, 'Có, không giới hạn số key null', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (634, 63, 'Chỉ khi dùng TreeMap',      false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ===== Câu hỏi WEB201 =====
INSERT INTO test_questions (question_id, test_id, question_content, question_type, score, created_at, updated_at) VALUES
  (111, 11, 'HTML là viết tắt của cụm từ nào?',                          'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (112, 11, 'Thẻ nào dùng để tạo liên kết (hyperlink)?',                 'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (113, 11, 'CSS dùng để làm gì?',                                       'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (114, 11, 'Thẻ tiêu đề lớn nhất trong HTML là thẻ nào?',               'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (115, 11, 'JavaScript chủ yếu chạy ở đâu trong ứng dụng web?',         'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (121, 12, 'Thuộc tính CSS nào đổi màu chữ?',                           'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (122, 12, 'Box model của CSS gồm những thành phần nào?',               'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (123, 12, 'Thẻ nào dùng để chèn hình ảnh vào trang?',                  'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (131, 13, 'display: flex dùng để làm gì?',                             'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (132, 13, 'DOM là viết tắt của cụm từ nào?',                           'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (133, 13, 'Media query trong CSS dùng để làm gì?',                     'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (141, 14, 'Thẻ nào tạo một đoạn văn bản (paragraph)?',                 'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (142, 14, 'File CSS được nhúng vào HTML bằng thẻ nào?',                'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (143, 14, 'Thuộc tính nào đặt màu nền cho phần tử?',                   'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (151, 15, 'Sự khác nhau giữa id và class trong CSS là gì?',            'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (152, 15, 'Hàm nào lấy phần tử theo id trong JavaScript?',             'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (153, 15, 'position: absolute định vị phần tử theo gì?',               'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (161, 16, 'Promise trong JavaScript dùng để làm gì?',                  'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (162, 16, 'localStorage khác sessionStorage ở điểm nào?',              'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (163, 16, 'CORS là cơ chế liên quan đến vấn đề gì?',                   'MULTIPLE_CHOICE', 1.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO test_answers (answer_id, question_id, answer_content, is_correct, created_at, updated_at) VALUES
  (1111, 111, 'HyperText Markup Language', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1112, 111, 'HighText Machine Language', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1113, 111, 'Hyperlink Text Mode Language', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1114, 111, 'Home Tool Markup Language', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1121, 112, '<a>',    true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1122, 112, '<link>', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1123, 112, '<href>', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1124, 112, '<url>',  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1131, 113, 'Định dạng giao diện, trình bày trang web', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1132, 113, 'Xây dựng cấu trúc nội dung',               false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1133, 113, 'Xử lý logic phía server',                  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1134, 113, 'Quản lý cơ sở dữ liệu',                    false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1141, 114, '<h1>',     true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1142, 114, '<h6>',     false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1143, 114, '<header>', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1144, 114, '<title>',  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1151, 115, 'Trên trình duyệt của người dùng', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1152, 115, 'Trên máy chủ web',                false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1153, 115, 'Trong cơ sở dữ liệu',             false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1154, 115, 'Trong hệ điều hành',              false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1211, 121, 'color',      true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1212, 121, 'font-color', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1213, 121, 'text-style', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1214, 121, 'background', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1221, 122, 'content, padding, border, margin', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1222, 122, 'header, body, footer',             false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1223, 122, 'width, height',                    false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1224, 122, 'row, column',                      false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1231, 123, '<img>',         true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1232, 123, '<picture src>', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1233, 123, '<image>',       false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1234, 123, '<src>',         false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1311, 131, 'Tạo bố cục linh hoạt theo trục hàng/cột', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1312, 131, 'Ẩn phần tử khỏi trang',                   false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1313, 131, 'Đổi màu nền phần tử',                     false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1314, 131, 'Thêm hiệu ứng chuyển động',               false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1321, 132, 'Document Object Model',   true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1322, 132, 'Data Object Management',  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1323, 132, 'Display Order Mode',      false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1324, 132, 'Document Order Markup',   false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1331, 133, 'Áp dụng CSS theo kích thước màn hình (responsive)', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1332, 133, 'Nhúng video vào trang',                             false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1333, 133, 'Truy vấn cơ sở dữ liệu',                            false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1334, 133, 'Tối ưu tốc độ tải trang',                           false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1411, 141, '<p>',    true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1412, 141, '<div>',  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1413, 141, '<span>', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1414, 141, '<text>', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1421, 142, '<link rel="stylesheet" href="...">', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1422, 142, '<script src="...">',                 false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1423, 142, '<css src="...">',                    false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1424, 142, '<style href="...">',                 false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1431, 143, 'background-color', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1432, 143, 'color',            false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1433, 143, 'bgcolor',          false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1434, 143, 'fill',             false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1511, 151, 'id là duy nhất trên trang, class dùng lại được nhiều lần', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1512, 151, 'id và class hoàn toàn giống nhau',                         false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1513, 151, 'class có độ ưu tiên cao hơn id',                           false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1514, 151, 'id chỉ dùng cho thẻ div',                                  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1521, 152, 'document.getElementById()',   true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1522, 152, 'document.querySelectorAll()', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1523, 152, 'window.findId()',             false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1524, 152, 'document.getName()',          false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1531, 153, 'Theo tổ tiên gần nhất có position khác static', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1532, 153, 'Luôn theo cửa sổ trình duyệt',                  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1533, 153, 'Theo phần tử đứng ngay trước nó',               false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1534, 153, 'Theo thẻ body',                                 false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1611, 161, 'Xử lý các thao tác bất đồng bộ',   true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1612, 161, 'Khai báo biến toàn cục',           false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1613, 161, 'Tạo vòng lặp vô hạn',              false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1614, 161, 'Định dạng chuỗi',                  false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1621, 162, 'localStorage giữ dữ liệu cả khi đóng trình duyệt, sessionStorage chỉ trong phiên', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1622, 162, 'sessionStorage lưu được nhiều dữ liệu hơn', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1623, 162, 'localStorage chỉ lưu số',                   false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1624, 162, 'Không có gì khác nhau',                     false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1631, 163, 'Chia sẻ tài nguyên giữa các origin khác nhau', true,  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1632, 163, 'Nén dữ liệu khi truyền',                       false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1633, 163, 'Mã hóa mật khẩu người dùng',                   false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1634, 163, 'Tăng tốc độ render trang',                     false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ---------------------------------------------------------------------
-- 6. Đồng bộ lại các sequence sau khi chèn ID tường minh
-- ---------------------------------------------------------------------
PERFORM setval(pg_get_serial_sequence('public.user_account', 'user_id'),                (SELECT MAX(user_id)       FROM user_account));
PERFORM setval(pg_get_serial_sequence('public.user_role', 'user_role_id'),              (SELECT MAX(user_role_id)  FROM user_role));
PERFORM setval(pg_get_serial_sequence('public.subjects', 'subject_id'),                 (SELECT MAX(subject_id)    FROM subjects));
PERFORM setval(pg_get_serial_sequence('public.classrooms', 'classroom_id'),             (SELECT MAX(classroom_id)  FROM classrooms));
PERFORM setval(pg_get_serial_sequence('public.classroom_subjects', 'id'),               (SELECT MAX(id)            FROM classroom_subjects));
PERFORM setval(pg_get_serial_sequence('public.classroom_subject_students', 'id'),       (SELECT MAX(id)            FROM classroom_subject_students));
PERFORM setval(pg_get_serial_sequence('public.learning_paths', 'path_id'),              (SELECT MAX(path_id)       FROM learning_paths));
PERFORM setval(pg_get_serial_sequence('public.learning_nodes', 'node_id'),              (SELECT MAX(node_id)       FROM learning_nodes));
PERFORM setval(pg_get_serial_sequence('public.node_edges', 'edge_id'),                  (SELECT MAX(edge_id)       FROM node_edges));
PERFORM setval(pg_get_serial_sequence('public.node_materials', 'material_id'),          (SELECT MAX(material_id)   FROM node_materials));
PERFORM setval(pg_get_serial_sequence('public.videos', 'video_id'),                     (SELECT MAX(video_id)      FROM videos));
PERFORM setval(pg_get_serial_sequence('public.tests', 'test_id'),                       (SELECT MAX(test_id)       FROM tests));
PERFORM setval(pg_get_serial_sequence('public.test_questions', 'question_id'),          (SELECT MAX(question_id)   FROM test_questions));
PERFORM setval(pg_get_serial_sequence('public.test_answers', 'answer_id'),              (SELECT MAX(answer_id)     FROM test_answers));

RAISE NOTICE 'Demo seed: hoan tat.';

END $$;

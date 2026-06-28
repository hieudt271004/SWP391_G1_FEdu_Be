SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'fedu_db'
  AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS fedu_db;

DROP ROLE IF EXISTS sa;

CREATE ROLE sa
    WITH
    LOGIN
    SUPERUSER
    CREATEDB
    CREATEROLE
    PASSWORD '123456';


CREATE DATABASE fedu_db
    OWNER sa;

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

GRANT ALL ON SCHEMA public TO sa;
GRANT ALL ON SCHEMA public TO public;

--------------------------------------------------------------------------------------------

-- Enum lưu dạng VARCHAR (entity map @Enumerated(EnumType.STRING)); KHÔNG dùng Postgres named enum
-- (named enum cần CREATE TYPE thủ công, vỡ trên DB mới). Giá trị hợp lệ ghi ở comment từng cột.

CREATE TABLE IF NOT EXISTS user_account (
                                            user_id    BIGSERIAL PRIMARY KEY,
                                            email      VARCHAR(100) NOT NULL UNIQUE,
                                            password   VARCHAR(255) NOT NULL,
                                            last_name  VARCHAR(255) NOT NULL,
                                            first_name VARCHAR(255) NOT NULL,
                                            avatar_url TEXT,
                                            is_deleted BOOLEAN DEFAULT FALSE,
                                            status     VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE/INACTIVE/NONE
                                            gender     VARCHAR(10), -- MALE/FEMALE/OTHER
                                            bod        DATE,
                                            phone      VARCHAR(50),
                                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
                                     role_id    BIGSERIAL PRIMARY KEY,
                                     role_name  VARCHAR(20) NOT NULL UNIQUE, -- ADMIN/TEACHER/STUDENT/SUB_MENTOR/USER
                                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_role (
                                         user_role_id BIGSERIAL PRIMARY KEY,
                                         user_id      BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                         role_id      BIGINT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
                                         UNIQUE(user_id, role_id)
);

CREATE TABLE IF NOT EXISTS permissions (
                                           permission_id   BIGSERIAL PRIMARY KEY,
                                           permission_name VARCHAR(100) NOT NULL UNIQUE,
                                           description     VARCHAR(255),
                                           created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                           updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permission (
                                               role_permission_id BIGSERIAL PRIMARY KEY,
                                               role_id            BIGINT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
                                               permission_id      BIGINT NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
                                               created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                               UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS tokens (
                                      id            BIGSERIAL PRIMARY KEY,
                                      user_id       BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                      access_token  TEXT,
                                      refresh_token TEXT,
                                      reset_token   TEXT,
                                      expired_at    TIMESTAMP,
                                      is_revoked    BOOLEAN DEFAULT FALSE,
                                      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
                                        subject_id   BIGSERIAL PRIMARY KEY,
                                        subject_code VARCHAR(50) UNIQUE NOT NULL,
                                        subject_name VARCHAR(255) NOT NULL,
                                        description  TEXT,
                                        learningpath_length INT,
                                        created_by   BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
                                        is_deleted   BOOLEAN DEFAULT FALSE,
                                        status       VARCHAR(50) NOT NULL DEFAULT 'draft',
                                        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classrooms (
                                          classroom_id BIGSERIAL PRIMARY KEY,
                                          class_name   VARCHAR(255) NOT NULL UNIQUE,
                                          semester     VARCHAR(50),
                                          description  TEXT,
                                          status       VARCHAR(50) NOT NULL DEFAULT 'inactive',
                                          is_deleted   BOOLEAN DEFAULT FALSE,
                                          created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classroom_subjects (
                                                  id           BIGSERIAL PRIMARY KEY,
                                                  classroom_id BIGINT NOT NULL REFERENCES classrooms(classroom_id) ON DELETE CASCADE,
                                                  subject_id   BIGINT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
                                                  lecturer_id  BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                                  id_quiz_start BIGINT, -- FK -> tests(test_id) added after tests table
                                                  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                  UNIQUE(classroom_id, subject_id)
);

CREATE TABLE IF NOT EXISTS classroom_subject_students (
                                                          id                   BIGSERIAL PRIMARY KEY,
                                                          classroom_subject_id BIGINT NOT NULL REFERENCES classroom_subjects(id) ON DELETE CASCADE,
                                                          student_id           BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                                          current_level        INT,
                                                          is_submentor         BOOLEAN NOT NULL DEFAULT FALSE,
                                                          joined_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                          created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                          updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                          UNIQUE(classroom_subject_id, student_id)
);

-- Bảng ánh xạ sub-mentor (CSS) → học sinh (CSS) trong cùng lớp-môn (peer mentoring)
CREATE TABLE IF NOT EXISTS sub_mentor_student_assignment (
    id                   BIGSERIAL PRIMARY KEY,
    sub_mentor_css_id    BIGINT NOT NULL REFERENCES classroom_subject_students(id) ON DELETE CASCADE,
    student_css_id       BIGINT NOT NULL REFERENCES classroom_subject_students(id) ON DELETE CASCADE,
    assigned_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sub_mentor_css_id, student_css_id),
    CHECK (sub_mentor_css_id <> student_css_id)
);

CREATE TABLE IF NOT EXISTS learning_paths (
                                              path_id          BIGSERIAL PRIMARY KEY,
                                              subject_id       BIGINT REFERENCES subjects(subject_id) ON DELETE CASCADE,
                                              path_name        VARCHAR(255) NOT NULL,
                                              description      TEXT,
                                              created_by       BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
                                              classroom_subject_id BIGINT REFERENCES classroom_subjects(id) ON DELETE CASCADE,
                                              is_deleted       BOOLEAN DEFAULT FALSE,
                                              published_at     TIMESTAMP NULL,
                                              published_by     BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
                                              created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                              updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_nodes (
                                              node_id       BIGSERIAL PRIMARY KEY,
                                              path_id       BIGINT NOT NULL REFERENCES learning_paths(path_id) ON DELETE CASCADE,
                                              title         VARCHAR(255) NOT NULL,
                                              description   TEXT,
                                              node_type     VARCHAR(20) NOT NULL, -- AT_HOME/ON_CLASS
                                              node_status   VARCHAR(20) NOT NULL DEFAULT 'LOCKED', -- LOCKED/OPEN/HIDDEN
                                              display_order INT NOT NULL DEFAULT 0,
                                              is_required   BOOLEAN NOT NULL DEFAULT TRUE,
                                              stage_order   INT, -- chặng thứ mấy (1..subjects.learningpath_length)
                                              level         INT, -- null = node chung; 1=yếu,2=tb,3=khá
                                              test_kind     VARCHAR(20) DEFAULT 'NONE', -- NONE/GATE/PLACEMENT/FREE_CHOICE
                                              applies_levels    VARCHAR(20),    -- mức làm test phân luồng (vd "1,2")
                                              gate_up_min       DECIMAL(5,2),   -- GATE: >= -> lên nhánh
                                              gate_down_max     DECIMAL(5,2),   -- GATE: <= -> xuống nhánh
                                              placement_yeu_max DECIMAL(5,2),   -- PLACEMENT: <= -> Yếu
                                              placement_tb_max  DECIMAL(5,2),   -- PLACEMENT: <= -> TB, còn lại Khá
                                              is_deleted    BOOLEAN DEFAULT FALSE,
                                              created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                              updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS node_edges (
                                          edge_id      BIGSERIAL PRIMARY KEY,
                                          from_node_id BIGINT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,
                                          to_node_id   BIGINT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,
                                          created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          UNIQUE(from_node_id, to_node_id)
);

CREATE TABLE IF NOT EXISTS student_learning_routes (
                                                       id          BIGSERIAL PRIMARY KEY,
                                                       student_id  BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                                       edge_id     BIGINT NOT NULL REFERENCES node_edges(edge_id) ON DELETE CASCADE,
                                                       assigned_by BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
                                                       assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS node_materials (
                                              material_id BIGSERIAL PRIMARY KEY,
                                              node_id     BIGINT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,
                                              title       VARCHAR(255) NOT NULL,
                                              required    BOOLEAN DEFAULT TRUE,
                                              order_index INT,
                                              is_deleted  BOOLEAN DEFAULT FALSE,
                                              created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                              updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS videos (
                                      video_id         BIGSERIAL PRIMARY KEY,
                                      material_id      BIGINT NOT NULL REFERENCES node_materials(material_id) ON DELETE CASCADE,
                                      video_url        TEXT NOT NULL,
                                      title            VARCHAR(255),
                                      duration_seconds INT,
                                      description      TEXT,
                                      is_deleted       BOOLEAN DEFAULT FALSE,
                                      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                      updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS files (
                                     file_id     BIGSERIAL PRIMARY KEY,
                                     material_id BIGINT NOT NULL REFERENCES node_materials(material_id) ON DELETE CASCADE,
                                     file_url    TEXT NOT NULL,
                                     file_name   VARCHAR(255),
                                     file_type   VARCHAR(100),
                                     public_id     VARCHAR(255), -- id asset trên Cloudinary (để xóa khi xóa material)
                                     resource_type VARCHAR(20),  -- image/raw/video (Cloudinary resource_type)
                                     description TEXT,
                                     is_deleted  BOOLEAN DEFAULT FALSE,
                                     created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                     updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bài tập thực hành: một THÀNH PHẦN của node (song song material/test).
-- Học sinh làm tự luận (text) và/hoặc nộp file. order_index xếp xen material/test.
CREATE TABLE IF NOT EXISTS node_exercises (
                                              exercise_id  BIGSERIAL PRIMARY KEY,
                                              node_id      BIGINT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,
                                              title        VARCHAR(255) NOT NULL,
                                              instructions TEXT,
                                              allow_text   BOOLEAN DEFAULT TRUE,
                                              allow_file   BOOLEAN DEFAULT TRUE,
                                              order_index  INT,
                                              is_deleted   BOOLEAN DEFAULT FALSE,
                                              created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                              updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tests (
                                     test_id            BIGSERIAL PRIMARY KEY,
                                     node_id            BIGINT REFERENCES learning_nodes(node_id) ON DELETE CASCADE, -- NULL: quiz phân loại (placement) không gắn node
                                     title              VARCHAR(255) NOT NULL,
                                     description        TEXT,
                                     duration_minutes   INT,
                                     passing_percentage DECIMAL(5,2),
                                     order_index        INT,
                                     is_deleted         BOOLEAN DEFAULT FALSE,
                                     created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                     updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_questions (
                                              question_id      BIGSERIAL PRIMARY KEY,
                                              test_id          BIGINT NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
                                              question_content TEXT NOT NULL,
                                              question_type    VARCHAR(50) NOT NULL DEFAULT 'MULTIPLE_CHOICE',
                                              score            DECIMAL(5,2) DEFAULT 1,
                                              created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                              updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_answers (
                                            answer_id      BIGSERIAL PRIMARY KEY,
                                            question_id    BIGINT NOT NULL REFERENCES test_questions(question_id) ON DELETE CASCADE,
                                            answer_content TEXT NOT NULL,
                                            is_correct     BOOLEAN DEFAULT FALSE,
                                            created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_test_attempts (
                                                     attempt_id   BIGSERIAL PRIMARY KEY,
                                                     test_id      BIGINT NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
                                                     student_id   BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                                     score        DECIMAL(5,2),
                                                     status       VARCHAR(20) DEFAULT 'SUBMITTED', -- IN_PROGRESS | SUBMITTED | CANCELLED (placement cancel/retake)
                                                     started_at   TIMESTAMP,
                                                     submitted_at TIMESTAMP,
                                                     created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                     updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_test_responses (
                                                      response_id        BIGSERIAL PRIMARY KEY,
                                                      attempt_id         BIGINT NOT NULL REFERENCES student_test_attempts(attempt_id) ON DELETE CASCADE,
                                                      question_id        BIGINT NOT NULL REFERENCES test_questions(question_id) ON DELETE CASCADE,
                                                      selected_answer_id BIGINT REFERENCES test_answers(answer_id) ON DELETE SET NULL,
                                                      response_text      TEXT,
                                                      is_correct         BOOLEAN,
                                                      created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                      updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                      UNIQUE(attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS student_selected_answers (
                                                        response_id BIGINT NOT NULL REFERENCES student_test_responses(response_id) ON DELETE CASCADE,
                                                        answer_id   BIGINT NOT NULL REFERENCES test_answers(answer_id) ON DELETE CASCADE,
                                                        PRIMARY KEY (response_id, answer_id)
);

CREATE TABLE IF NOT EXISTS student_node_progress (
                                                     progress_id  BIGSERIAL PRIMARY KEY,
                                                     classroom_subject_student_id BIGINT NOT NULL REFERENCES classroom_subject_students(id) ON DELETE CASCADE, -- ghi danh (student + lớp-môn + current_level)
                                                     node_id      BIGINT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,
                                                     path_id      BIGINT NOT NULL REFERENCES learning_paths(path_id) ON DELETE CASCADE,
                                                     order_index  INT NOT NULL DEFAULT 0,
                                                     status       VARCHAR(50) NOT NULL DEFAULT 'LOCKED',
                                                     unlocked_at  TIMESTAMP,
                                                     completed_at TIMESTAMP,
                                                     created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                     updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                     UNIQUE(classroom_subject_student_id, node_id, path_id)
);

CREATE TABLE IF NOT EXISTS submissions (
                                           submission_id     BIGSERIAL PRIMARY KEY,
                                           node_id           BIGINT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,
                                           exercise_id       BIGINT REFERENCES node_exercises(exercise_id) ON DELETE CASCADE,
                                           student_id        BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                           graded_by         BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
                                           title             VARCHAR(255),
                                           content           TEXT,
                                           file_url          TEXT,
                                           submission_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING/SUBMITTED/LATE/GRADED
                                           grade             DECIMAL(5,2),
                                           feedback          TEXT,
                                           is_deleted        BOOLEAN DEFAULT FALSE,
                                           submitted_at      TIMESTAMP,
                                           graded_at         TIMESTAMP,
                                           created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                           updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS node_questions (
                                              question_id BIGSERIAL PRIMARY KEY,
                                              node_id     BIGINT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,
                                              student_id  BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                              content     TEXT NOT NULL,
                                              is_deleted  BOOLEAN DEFAULT FALSE,
                                              created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                              updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_answers (
                                                answer_id   BIGSERIAL PRIMARY KEY,
                                                question_id BIGINT NOT NULL REFERENCES node_questions(question_id) ON DELETE CASCADE,
                                                lecturer_id BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                                content     TEXT NOT NULL,
                                                is_deleted  BOOLEAN DEFAULT FALSE,
                                                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS node_reviews (
                                            review_id  BIGSERIAL PRIMARY KEY,
                                            node_id    BIGINT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,
                                            student_id BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                            rating     INT CHECK (rating BETWEEN 1 AND 5),
                                            content    TEXT,
                                            is_deleted BOOLEAN DEFAULT FALSE,
                                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            UNIQUE(student_id, node_id)
);

-- Support ticket theo mô hình peer-mentoring: student → sub-mentor → (leo thang) → lecturer
CREATE TABLE IF NOT EXISTS support_tickets (
    ticket_id                      BIGSERIAL PRIMARY KEY,
    classroom_subject_student_id   BIGINT NOT NULL REFERENCES classroom_subject_students(id) ON DELETE CASCADE,
    message_student                TEXT NOT NULL,
    message_response               TEXT,
    status                         VARCHAR(20) NOT NULL DEFAULT 'NONE', -- NONE / DONE / SEND
    is_deleted                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles(role_name) VALUES ('ADMIN') ON CONFLICT (role_name) DO NOTHING;
INSERT INTO roles(role_name) VALUES ('TEACHER') ON CONFLICT (role_name) DO NOTHING;
INSERT INTO roles(role_name) VALUES ('STUDENT') ON CONFLICT (role_name) DO NOTHING;
INSERT INTO roles(role_name) VALUES ('SUB_MENTOR') ON CONFLICT (role_name) DO NOTHING;
INSERT INTO roles(role_name) VALUES ('USER') ON CONFLICT (role_name) DO NOTHING;

-- Adaptive placement learning path: tests.node_id nullable (placement quiz không gắn node)
ALTER TABLE tests ALTER COLUMN node_id DROP NOT NULL;

-- FK classroom_subjects.id_quiz_start -> tests (added after tests table exists)
ALTER TABLE classroom_subjects
    ADD CONSTRAINT fk_classroom_subjects_quiz_start
    FOREIGN KEY (id_quiz_start) REFERENCES tests(test_id) ON DELETE SET NULL;

-- Khoảng điểm quiz (placement + cổng test) do giảng viên cấu hình
CREATE TABLE IF NOT EXISTS quiz_score_bands (
    band_id      BIGSERIAL PRIMARY KEY,
    test_id      BIGINT NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
    min_score    DECIMAL(5,2) NOT NULL,
    max_score    DECIMAL(5,2) NOT NULL,
    target_level INT NOT NULL, -- 1=yếu, 2=tb, 3=khá
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lịch sử thay đổi mức năng lực của học sinh
CREATE TABLE IF NOT EXISTS student_level_history (
    id                   BIGSERIAL PRIMARY KEY,
    student_id           BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
    classroom_subject_id BIGINT NOT NULL REFERENCES classroom_subjects(id) ON DELETE CASCADE,
    old_level            INT,
    new_level            INT NOT NULL,
    reason               VARCHAR(50) NOT NULL, -- PLACEMENT | GATE | RETAKE | FREE_CHOICE
    changed_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance and uniqueness
-- Mỗi lớp-môn chỉ có TỐI ĐA 1 lộ trình clone đang hoạt động (mô hình 1-path; cột level đã bỏ).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_classroom_subject_path ON learning_paths(classroom_subject_id) WHERE classroom_subject_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_node_edges_from ON node_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_node_edges_to ON node_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_snp_path_status ON student_node_progress(path_id, status);
CREATE INDEX IF NOT EXISTS idx_quiz_score_bands_test ON quiz_score_bands(test_id);
CREATE INDEX IF NOT EXISTS idx_slh_student_cs ON student_level_history(student_id, classroom_subject_id);

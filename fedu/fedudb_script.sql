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

CREATE TYPE e_role AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'SUB_MENTOR', 'USER');
CREATE TYPE e_user_status AS ENUM ('ACTIVE', 'INACTIVE', 'NONE');
CREATE TYPE e_gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE e_node_type AS ENUM ('AT_HOME', 'ON_CLASS');
CREATE TYPE e_node_status AS ENUM ('LOCKED', 'OPEN', 'HIDDEN');
CREATE TYPE e_submission_status AS ENUM ('PENDING', 'SUBMITTED', 'LATE', 'GRADED');
CREATE TYPE e_ticket_status AS ENUM ('OPEN', 'PROCESSING', 'RESOLVED', 'CLOSED');
CREATE TYPE e_ticket_level AS ENUM ('SUB_MENTOR', 'LECTURER');

CREATE TABLE IF NOT EXISTS user_account (
                                            user_id    BIGSERIAL PRIMARY KEY,
                                            email      VARCHAR(100) NOT NULL UNIQUE,
                                            password   VARCHAR(255) NOT NULL,
                                            last_name  VARCHAR(255) NOT NULL,
                                            first_name VARCHAR(255) NOT NULL,
                                            avatar_url TEXT,
                                            is_deleted BOOLEAN DEFAULT FALSE,
                                            status     e_user_status NOT NULL DEFAULT 'ACTIVE',
                                            gender     e_gender,
                                            bod        DATE,
                                            phone      VARCHAR(50),
                                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
                                     role_id    BIGSERIAL PRIMARY KEY,
                                     role_name  e_role NOT NULL UNIQUE,
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
                                        created_by   BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
                                        is_deleted   BOOLEAN DEFAULT FALSE,
                                        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classrooms (
                                          classroom_id BIGSERIAL PRIMARY KEY,
                                          class_name   VARCHAR(255) NOT NULL UNIQUE,
                                          semester     VARCHAR(50),
                                          description  TEXT,
                                          is_deleted   BOOLEAN DEFAULT FALSE,
                                          created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classroom_subjects (
                                                  id           BIGSERIAL PRIMARY KEY,
                                                  classroom_id BIGINT NOT NULL REFERENCES classrooms(classroom_id) ON DELETE CASCADE,
                                                  subject_id   BIGINT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
                                                  lecturer_id  BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                                  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                  UNIQUE(classroom_id, subject_id)
);

CREATE TABLE IF NOT EXISTS classroom_subject_students (
                                                          id                   BIGSERIAL PRIMARY KEY,
                                                          classroom_subject_id BIGINT NOT NULL REFERENCES classroom_subjects(id) ON DELETE CASCADE,
                                                          student_id           BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                                          joined_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                          created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                          updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                          UNIQUE(classroom_subject_id, student_id)
);

CREATE TABLE IF NOT EXISTS classroom_sub_mentor (
                                                    id                   BIGSERIAL PRIMARY KEY,
                                                    classroom_subject_id BIGINT NOT NULL REFERENCES classroom_subjects(id) ON DELETE CASCADE,
                                                    sub_mentor_id        BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                                    assigned_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                    UNIQUE(classroom_subject_id, sub_mentor_id)
);

CREATE TABLE IF NOT EXISTS learning_paths (
                                              path_id          BIGSERIAL PRIMARY KEY,
                                              subject_id       BIGINT REFERENCES subjects(subject_id) ON DELETE CASCADE,
                                              path_name        VARCHAR(255) NOT NULL,
                                              description      TEXT,
                                              created_by       BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
                                              classroom_id     BIGINT REFERENCES classrooms(classroom_id) ON DELETE CASCADE,
                                              original_path_id BIGINT REFERENCES learning_paths(path_id) ON DELETE SET NULL,
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
                                              node_type     e_node_type NOT NULL,
                                              node_status   e_node_status NOT NULL DEFAULT 'LOCKED',
                                              display_order INT NOT NULL DEFAULT 0,
                                              is_required   BOOLEAN NOT NULL DEFAULT TRUE,
                                              branch_name   VARCHAR(100),
                                              is_deleted    BOOLEAN DEFAULT FALSE,
                                              created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                              updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS node_edges (
                                          edge_id      BIGSERIAL PRIMARY KEY,
                                          from_node_id BIGINT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,
                                          to_node_id   BIGINT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,
                                          branch_name  VARCHAR(100),
                                          min_score    DECIMAL(5,2),
                                          max_score    DECIMAL(5,2),
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
                                     description TEXT,
                                     is_deleted  BOOLEAN DEFAULT FALSE,
                                     created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                     updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tests (
                                     test_id            BIGSERIAL PRIMARY KEY,
                                     node_id            BIGINT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,
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
                                                     student_id   BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                                     node_id      BIGINT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,
                                                     path_id      BIGINT NOT NULL REFERENCES learning_paths(path_id) ON DELETE CASCADE,
                                                     order_index  INT NOT NULL DEFAULT 0,
                                                     status       VARCHAR(50) NOT NULL DEFAULT 'LOCKED',
                                                     unlocked_at  TIMESTAMP,
                                                     completed_at TIMESTAMP,
                                                     created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                     updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                     UNIQUE(student_id, node_id, path_id)
);

CREATE TABLE IF NOT EXISTS submissions (
                                           submission_id     BIGSERIAL PRIMARY KEY,
                                           node_id           BIGINT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,
                                           student_id        BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                           graded_by         BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
                                           title             VARCHAR(255),
                                           content           TEXT,
                                           file_url          TEXT,
                                           submission_status e_submission_status DEFAULT 'PENDING',
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

CREATE TABLE IF NOT EXISTS support_tickets (
                                               ticket_id            BIGSERIAL PRIMARY KEY,
                                               classroom_subject_id BIGINT NOT NULL REFERENCES classroom_subjects(id) ON DELETE CASCADE,
                                               created_by           BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                               assigned_to          BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL,
                                               title                VARCHAR(255) NOT NULL,
                                               description          TEXT NOT NULL,
                                               ticket_status        e_ticket_status DEFAULT 'OPEN',
                                               ticket_level         e_ticket_level DEFAULT 'SUB_MENTOR',
                                               is_deleted           BOOLEAN DEFAULT FALSE,
                                               created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                               updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_comments (
                                               comment_id BIGSERIAL PRIMARY KEY,
                                               ticket_id  BIGINT NOT NULL REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
                                               user_id    BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                                               content    TEXT NOT NULL,
                                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles(role_name) VALUES ('ADMIN') ON CONFLICT (role_name) DO NOTHING;
INSERT INTO roles(role_name) VALUES ('TEACHER') ON CONFLICT (role_name) DO NOTHING;
INSERT INTO roles(role_name) VALUES ('STUDENT') ON CONFLICT (role_name) DO NOTHING;
INSERT INTO roles(role_name) VALUES ('SUB_MENTOR') ON CONFLICT (role_name) DO NOTHING;
INSERT INTO roles(role_name) VALUES ('USER') ON CONFLICT (role_name) DO NOTHING;

-- Indexes for performance and uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_classroom_path ON learning_paths(classroom_id) WHERE classroom_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_node_edges_from ON node_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_node_edges_to ON node_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_snp_path_status ON student_node_progress(path_id, status);

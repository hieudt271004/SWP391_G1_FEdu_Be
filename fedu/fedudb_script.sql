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

-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.e_role AS ENUM (
    'ADMIN',
    'TEACHER',
    'STUDENT',
    'SUB_MENTOR',
	'USER'
);

CREATE TYPE public.e_user_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'NONE'
);

CREATE TYPE public.e_node_type AS ENUM (
    'AT_HOME',
    'ON_CLASS'
);

CREATE TYPE public.e_node_status AS ENUM (
    'LOCKED',
    'OPEN',
    'HIDDEN'
);

CREATE TYPE public.e_ticket_status AS ENUM (
    'OPEN',
    'PROCESSING',
    'RESOLVED',
    'CLOSED'
);

CREATE TYPE public.e_ticket_level AS ENUM (
    'SUB_MENTOR',
    'LECTURER'
);

CREATE TYPE public.e_submission_status AS ENUM (
    'PENDING',
    'SUBMITTED',
    'LATE',
    'GRADED'
);

CREATE TYPE public."e_gender" AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER');

-- =========================================================
-- AUTHENTICATION & AUTHORIZATION
-- =========================================================

CREATE TABLE user_account (
                              user_id SERIAL PRIMARY KEY,

                              email VARCHAR(100) NOT NULL UNIQUE,
                              password VARCHAR(255) NOT NULL,
                              last_name VARCHAR(255) NOT NULL,
                              first_name VARCHAR(255) NOT NULL,
                              avatar_url TEXT,
                              gender public."e_gender",
                              bod DATE,
                              phone VARCHAR(50),

                              status public.e_user_status NOT NULL DEFAULT 'ACTIVE',

                              is_deleted BOOLEAN DEFAULT FALSE,

                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
                       role_id SERIAL PRIMARY KEY,

                       role_name public.e_role NOT NULL UNIQUE,

                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
                             permission_id SERIAL PRIMARY KEY,

                             permission_name VARCHAR(100) NOT NULL UNIQUE,
                             description VARCHAR(255),

                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_role (
                           user_role_id SERIAL PRIMARY KEY,

                           user_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
                           role_id INT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,

                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                           UNIQUE(user_id, role_id)
);

CREATE TABLE role_permission (
                                 role_permission_id SERIAL PRIMARY KEY,

                                 role_id INT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
                                 permission_id INT NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,

                                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                                 UNIQUE(role_id, permission_id)
);

CREATE TABLE login_history (
                               id SERIAL PRIMARY KEY,

                               last_login TIMESTAMP,

                               user_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,

                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tokens (
                        id SERIAL PRIMARY KEY,

                        user_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,

                        access_token TEXT,
                        refresh_token TEXT,
                        reset_token TEXT,

                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- SUBJECTS & CLASSROOMS
-- =========================================================

CREATE TABLE subjects (
                          subject_id SERIAL PRIMARY KEY,

                          subject_code VARCHAR(50) UNIQUE NOT NULL,
                          subject_name VARCHAR(255) NOT NULL,
                          description TEXT,

                          created_by INT REFERENCES user_account(user_id) ON DELETE SET NULL,

                          is_deleted BOOLEAN DEFAULT FALSE,

                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE classrooms (
                            classroom_id SERIAL PRIMARY KEY,

                            subject_id INT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,

                            class_name VARCHAR(255) NOT NULL,
                            semester VARCHAR(50),
                            description TEXT,

                            lecturer_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,

                            is_deleted BOOLEAN DEFAULT FALSE,

                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE classroom_student (
                                   id SERIAL PRIMARY KEY,

                                   classroom_id INT NOT NULL REFERENCES classrooms(classroom_id) ON DELETE CASCADE,
                                   student_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,

                                   joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                                   UNIQUE(classroom_id, student_id)
);

CREATE TABLE classroom_sub_mentor (
                                      id SERIAL PRIMARY KEY,

                                      classroom_id INT NOT NULL REFERENCES classrooms(classroom_id) ON DELETE CASCADE,
                                      sub_mentor_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,

                                      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                                      UNIQUE(classroom_id, sub_mentor_id)
);

-- =========================================================
-- LEARNING PATH TEMPLATE
-- =========================================================

CREATE TABLE learning_paths (
                                path_id SERIAL PRIMARY KEY,

                                subject_id INT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,

                                path_name VARCHAR(255) NOT NULL,
                                description TEXT,

                                created_by INT REFERENCES user_account(user_id) ON DELETE SET NULL,

                                is_deleted BOOLEAN DEFAULT FALSE,

                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- CLASSROOM PATH (CLONE)
-- =========================================================

CREATE TABLE classroom_learning_paths (
                                          classroom_path_id SERIAL PRIMARY KEY,

                                          classroom_id INT NOT NULL REFERENCES classrooms(classroom_id) ON DELETE CASCADE,

                                          original_path_id INT REFERENCES learning_paths(path_id) ON DELETE SET NULL,

                                          path_name VARCHAR(255) NOT NULL,
                                          description TEXT,

                                          is_deleted BOOLEAN DEFAULT FALSE,

                                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- LEARNING NODES
-- =========================================================

CREATE TABLE learning_nodes (
                                node_id SERIAL PRIMARY KEY,

                                classroom_path_id INT REFERENCES classroom_learning_paths(classroom_path_id) ON DELETE CASCADE,

                                title VARCHAR(255) NOT NULL,
                                description TEXT,

                                node_type public.e_node_type NOT NULL,

                                branch_name VARCHAR(255),

                                display_order INT NOT NULL,

                                status public.e_node_status NOT NULL DEFAULT 'LOCKED',

                                is_required BOOLEAN DEFAULT TRUE,

                                is_deleted BOOLEAN DEFAULT FALSE,

                                path_id INT REFERENCES learning_paths(path_id) ON DELETE CASCADE,

                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- GRAPH / BRANCH FLOW
-- =========================================================

CREATE TABLE node_edges (
                            edge_id SERIAL PRIMARY KEY,

                            from_node_id INT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,
                            to_node_id INT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,

                            branch_name VARCHAR(255),

                            min_score DECIMAL(5,2),
                            max_score DECIMAL(5,2),

                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                            UNIQUE(from_node_id, to_node_id)
);

-- =========================================================
-- PERSONALIZED ROUTE
-- =========================================================

CREATE TABLE student_learning_routes (
                                         id SERIAL PRIMARY KEY,

                                         student_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,

                                         edge_id INT NOT NULL REFERENCES node_edges(edge_id) ON DELETE CASCADE,

                                         assigned_by INT REFERENCES user_account(user_id) ON DELETE SET NULL,

                                         assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- NODE MATERIALS
-- =========================================================

CREATE TABLE node_materials (
                                material_id SERIAL PRIMARY KEY,

                                node_id INT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,

                                title VARCHAR(255) NOT NULL,

                                file_url TEXT,
                                video_url TEXT,

                                is_deleted BOOLEAN DEFAULT FALSE,

                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TEST SYSTEM
-- =========================================================

CREATE TABLE tests (
                       test_id SERIAL PRIMARY KEY,

                       node_id INT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,

                       title VARCHAR(255) NOT NULL,
                       description TEXT,

                       duration_minutes INT,

                       passing_score DECIMAL(5,2),

                       is_deleted BOOLEAN DEFAULT FALSE,

                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE test_questions (
                                question_id SERIAL PRIMARY KEY,

                                test_id INT NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,

                                question_content TEXT NOT NULL,

                                score DECIMAL(5,2) DEFAULT 1,

                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE test_answers (
                              answer_id SERIAL PRIMARY KEY,

                              question_id INT NOT NULL REFERENCES test_questions(question_id) ON DELETE CASCADE,

                              answer_content TEXT NOT NULL,

                              is_correct BOOLEAN DEFAULT FALSE,

                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_test_attempts (
                                       attempt_id SERIAL PRIMARY KEY,

                                       test_id INT NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,

                                       student_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,

                                       score DECIMAL(5,2),

                                       started_at TIMESTAMP,
                                       submitted_at TIMESTAMP,

                                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- STUDENT PROGRESS
-- =========================================================

CREATE TABLE student_node_progress (
                                       progress_id SERIAL PRIMARY KEY,

                                       student_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,

                                       node_id INT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,

                                       is_completed BOOLEAN DEFAULT FALSE,

                                       unlocked_at TIMESTAMP,
                                       completed_at TIMESTAMP,

                                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                                       UNIQUE(student_id, node_id)
);

-- =========================================================
-- SUBMISSIONS
-- =========================================================

CREATE TABLE submissions (
                             submission_id SERIAL PRIMARY KEY,

                             node_id INT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,

                             student_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,

                             title VARCHAR(255),

                             content TEXT,

                             file_url TEXT,

                             status public.e_submission_status DEFAULT 'PENDING',

                             grade DECIMAL(5,2),

                             feedback TEXT,

                             is_deleted BOOLEAN DEFAULT FALSE,

                             submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- QUESTIONS
-- =========================================================

CREATE TABLE node_questions (
                                question_id SERIAL PRIMARY KEY,

                                node_id INT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,

                                student_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,

                                content TEXT NOT NULL,

                                is_deleted BOOLEAN DEFAULT FALSE,

                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE question_answers (
                                  answer_id SERIAL PRIMARY KEY,

                                  question_id INT NOT NULL REFERENCES node_questions(question_id) ON DELETE CASCADE,

                                  lecturer_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,

                                  content TEXT NOT NULL,

                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- REVIEWS
-- =========================================================

CREATE TABLE node_reviews (
                              review_id SERIAL PRIMARY KEY,

                              node_id INT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE,

                              student_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,

                              rating INT CHECK (rating BETWEEN 1 AND 5),

                              content TEXT,

                              is_deleted BOOLEAN DEFAULT FALSE,

                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                              UNIQUE(student_id, node_id)
);

-- =========================================================
-- SUPPORT TICKETS
-- =========================================================

CREATE TABLE support_tickets (
                                 ticket_id SERIAL PRIMARY KEY,

                                 classroom_id INT NOT NULL REFERENCES classrooms(classroom_id) ON DELETE CASCADE,

                                 created_by INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,

                                 assigned_to INT REFERENCES user_account(user_id) ON DELETE SET NULL,

                                 title VARCHAR(255) NOT NULL,

                                 description TEXT NOT NULL,

                                 status public.e_ticket_status DEFAULT 'OPEN',

                                 support_level public.e_ticket_level DEFAULT 'SUB_MENTOR',

                                 is_deleted BOOLEAN DEFAULT FALSE,

                                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ticket_comments (
                                 comment_id SERIAL PRIMARY KEY,

                                 ticket_id INT NOT NULL REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,

                                 user_id INT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,

                                 content TEXT NOT NULL,

                                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- ROLES
-- =========================================================

INSERT INTO roles(role_name)
VALUES
    ('ADMIN'),
    ('TEACHER'),
    ('STUDENT'),
    ('SUB_MENTOR'),
    ('USER');

-- =========================================================
-- PERMISSIONS
-- =========================================================

INSERT INTO permissions(permission_name, description)
VALUES
    ('CREATE_CLASSROOM', '/classroom/create'),
    ('MANAGE_NODE', '/node/manage'),
    ('GRADE_SUBMISSION', '/submission/grade'),
    ('OPEN_ON_CLASS_NODE', '/node/open'),
    ('CREATE_TICKET', '/ticket/create'),
    ('ANSWER_QUESTION', '/question/answer');

-- teacher permissions
INSERT INTO role_permission(role_id, permission_id)
VALUES
    (2,1),
    (2,2),
    (2,3),
    (2,4);

-- student permissions
INSERT INTO role_permission(role_id, permission_id)
VALUES
    (3,5);

-- sub mentor permissions
INSERT INTO role_permission(role_id, permission_id)
VALUES
    (4,5);





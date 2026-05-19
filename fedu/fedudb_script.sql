CREATE DATABASE fedu_db;

CREATE TYPE public."e_role" AS ENUM (
	'ADMIN',
	'TEACHER',
	'STUDENT',
	'SUB_MENTOR',
    'USER');

CREATE TYPE public."e_user_status" AS ENUM (
	'ACTIVE',
	'INACTIVE',
	'NONE');

CREATE TABLE user_account (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    status public."e_user_status" NOT NULL
);

CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name public."e_role" NOT NULL
);

CREATE TABLE permissions (
    permission_id SERIAL PRIMARY KEY,
    permission_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL
);

CREATE TABLE user_role (
    user_role_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES user_account(user_id),
    role_id INT NOT NULL REFERENCES roles(role_id)
);

CREATE TABLE role_permission (
    role_permission_id SERIAL PRIMARY KEY,
    role_id INT NOT NULL REFERENCES roles(role_id),
    permission_id INT NOT NULL REFERENCES permissions(permission_id)
);

CREATE TABLE login_history(
	id SERIAL PRIMARY KEY,
	last_login DATE,
	user_id INT NOT NULL REFERENCES user_account(user_id)
);

CREATE TABLE tokens (
    id SERIAL NOT NULL PRIMARY KEY,
    email      VARCHAR(255)   NOT NULL,
    access_token  VARCHAR(255),
    refresh_token VARCHAR(255),
    reset_token   VARCHAR(255),
    created_at    DATE,
    updated_at    DATE
);
------------------------------------------------------------------------------------------------------------------------
INSERT INTO roles (role_name)
VALUES
('ADMIN'),
('TEACHER'),
('STUDENT'),
('SUB_MENTOR'),
('USER');

INSERT INTO permissions (permission_name, description)
VALUES
('CREATE_USER', '/user/add'),
('READ_USER', '/user/{id}'),
('UPDATE_USER', '/user/{id}'),
('DELETE_USER', '/user/{id}');

INSERT INTO role_permission (role_id, permission_id)
VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4);
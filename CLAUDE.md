# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout

The actual application is the Maven project in `fedu/` — always work there. Other top-level items:

- `fedudb_script.sql` — the database schema script. `spring.jpa.hibernate.ddl-auto` is `none`, so the schema is created from this script, not by Hibernate.
- `fedu/test/` — a leftover, unrelated Gradle scaffold (`com.example.test`). Ignore it; it is not the test suite.
- `SWP391_G1_FEdu_Fe/` — untracked checkout of the frontend repo (served at `http://localhost:5173`, which CORS is configured for).

## Commands

Run from `fedu/` (Maven wrapper, Windows):

```powershell
.\mvnw.cmd spring-boot:run          # run the app (port 8080)
.\mvnw.cmd clean package            # build
.\mvnw.cmd test                     # all tests
.\mvnw.cmd test -Dtest=FeduApplicationTests           # single test class
.\mvnw.cmd test -Dtest=FeduApplicationTests#method    # single test method
```

Required environment variables (referenced in `application.yml`, no defaults for JWT keys): `DB_PASSWORD`, `MAIL_PASSWORD`, `JWT_ACCESS_KEY`, `JWT_REFRESH_KEY`, `JWT_RESET_KEY`. The datasource points at a shared Neon cloud PostgreSQL instance.

Swagger UI is at `http://localhost:8080/swagger-ui/index.html` (springdoc; excluded from security in `AppConfig.webSecurityCustomizer`).

## Architecture

Java 17 / Spring Boot 3.3 REST API, stateless JWT auth, layered:

`controller` → `service` (interfaces) → `service/Impl` (implementations) → `repository` (Spring Data JPA) → PostgreSQL

### Security flow (config/AppConfig.java + config/PreFilter.java)

- `PreFilter` (a `OncePerRequestFilter`) parses the `Authorization: Bearer` header, validates the access token via `JwtService`, and populates the `SecurityContext`. An invalid/expired token short-circuits with a 401 JSON body — it does not continue the chain.
- `AppConfig` defines the whitelist (`/auth/*` endpoints) and role-based URL rules: `/admin/**` → ADMIN, `/teacher/**` and `/teacher-manage/**` → TEACHER, `/student/sub-mentor/**` → SUB_MENTOR, `/student/**` → STUDENT. Method security (`@EnableMethodSecurity`) is also enabled.
- Roles come from `UserAccount.getAuthorities()`, which prefixes `ROLE_` onto the `UserRole` → `Role` → `UserRole` enum name. `UserAccount` implements `UserDetails` directly.
- There are three JWT token types (`TokenType`: access / refresh / reset-password), each signed with its own key and expiry (`jwt.*` in `application.yml`).

### Response and error conventions

- Every controller returns the envelope `ResponseData<T>` (`{status, message, data}`), where `status` repeats the HTTP status code; `ResponseError`/`ResponseFailure` are the error variants of the same shape.
- `GlobalExceptionHandler` (`@RestControllerAdvice`) maps validation, auth, and not-found exceptions into that same envelope. Custom exceptions: `InvalidDataException`, `ResourceNotFoundException`.
- User-facing messages and code comments are a mix of Vietnamese and English; match the surrounding style.

### Persistence conventions

- Entities live in `entity/`, share `AbstractEntity` (`createdAt`/`updatedAt` via Hibernate timestamps).
- Enums (in `utils/enums/`) are mapped with `@Enumerated(EnumType.STRING)` to varchar columns. Do **not** use `@JdbcTypeCode(NAMED_ENUM)` / `columnDefinition = "e_xxx"` — that approach was deliberately removed because named Postgres enum types require manual `CREATE TYPE` and break on fresh databases.
- Custom Bean Validation annotations are split between `dto/validator/` (annotations) and `utils/` (their validator implementations), e.g. `@EnumPattern`, `@PhoneNumber`, `@GenderSubset`.

### DTO conventions

Request DTOs in `dto/req/`, response DTOs in `dto/res/`. Controllers validate with `@Valid` and are organized by audience: `controller/admin/`, `controller/teacher/`, `controller/auth/`, plus shared root-level controllers.

## Agentic Coding & Best Practices

To ensure high-quality, logic-driven, and robust code modifications, always adhere to the following practices:

- **Incremental Edits**: Avoid modifying entire files or replacing large sections unless necessary. Target precise lines and code blocks using standard diff-replacement tools.
- **Verification & Testing**: After any code change, verify the changes by running Maven tests or building the project (`mvn clean package` or `mvn test` in the `fedu/` directory). Never mark a task as complete without verifying it works.
- **Strict Error Handling**: Write defensive code. In Java, use custom exceptions like `ResourceNotFoundException` or `InvalidDataException` and rely on `@RestControllerAdvice` for global error mapping. Always ensure inputs are validated with `@Valid` or specific constraints.
- **Database Integrity**: Since `ddl-auto` is `none`, any database schema modifications must be updated in `fedudb_script.sql`. Ensure custom JPA entities map exactly to their SQL definition. Do not use named Postgres enums.
- **DTO Isolation**: Never expose entity models directly to controller endpoints. Always map entities to/from DTOs (using builders or mapper utilities) to preserve API-domain isolation.
- **Environment Parity**: Always ensure any environment-specific properties (e.g. database host, mail servers, CORS origins) are configurable via environment variables in `application.yml` and `.env` for Docker/production deployment parity.

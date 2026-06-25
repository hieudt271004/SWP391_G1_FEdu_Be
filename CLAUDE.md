# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout

The actual application is the Maven project in `fedu/` — always work there. Other items:

- `fedu/fedudb_script.sql` — the database schema script. `spring.jpa.hibernate.ddl-auto` is `none`, so the schema comes from this script, **not** from Hibernate. Any entity/column change must be mirrored here.
- `diagram/erd.md` + `diagram/erd.puml` — ERD of the schema; read these first to understand table relationships.
- `fedu/test/` — a leftover, unrelated Gradle scaffold (`com.example.test`). Ignore it; the real tests are in `fedu/src/test/`.
- `SWP391_G1_FEdu_Fe/` — untracked checkout of the frontend repo (Vite, served at `http://localhost:5173`, which CORS is configured for). It is a separate project, not part of this Maven build.
- `uploads/` — runtime storage for uploaded files; served back at `/uploads/**` and mounted as a Docker volume.
- `.env.example` — copy to `.env` and fill credentials before using Docker Compose.

## Commands

Run from `fedu/` (Maven wrapper, Windows):

```powershell
.\mvnw.cmd spring-boot:run          # run the app (port 8080)
.\mvnw.cmd clean package            # build
.\mvnw.cmd test                     # all tests
.\mvnw.cmd test -Dtest=LearningPathIntegrationTest          # single test class
.\mvnw.cmd test -Dtest=LevelRoutingServiceImplTest#method   # single test method
```

The real test suite is `fedu/src/test/java/com/fedu/fedu/`: `LearningPathIntegrationTest`, `QuestionManagementIntegrationTest`, and the routing unit tests (`LearningPathServiceImplTest`, `LevelRoutingServiceImplTest`, `StudentTestServiceImplGateRoutingTest`). `FeduApplicationTests` is just the context-load smoke test.

Required environment variables (referenced in `application.yml`; the three JWT keys have **no defaults** and must be set): `DB_PASSWORD`, `MAIL_PASSWORD`, `JWT_ACCESS_KEY`, `JWT_REFRESH_KEY`, `JWT_RESET_KEY`. Docker additionally reads `DB_URL`, `DB_USERNAME`, `ALLOWED_ORIGINS`. The datasource points at a shared Neon cloud PostgreSQL instance.

Swagger UI is at `http://localhost:8080/swagger-ui/index.html` (springdoc; excluded from security in `AppConfig.webSecurityCustomizer`).

### Docker

`docker-compose.yml` (repo root) wires two services from `.env`: `backend` (built from `fedu/Dockerfile`, port 8080, `./uploads` volume) and `frontend` (built from `SWP391_G1_FEdu_Fe/`, host-mounted, exposed on port 80). The backend Dockerfile is a multi-stage layered build running as a non-root `spring` user.

## Architecture

Java 17 / Spring Boot 3.3 REST API, stateless JWT auth, layered:

`controller` → `service` (interfaces) → `service/Impl` (implementations) → `repository` (Spring Data JPA) → PostgreSQL

### Security flow (config/AppConfig.java + config/PreFilter.java)

- `PreFilter` (a `OncePerRequestFilter`) parses the `Authorization: Bearer` header, validates the access token via `JwtService`, and populates the `SecurityContext`. An invalid/expired token short-circuits with a 401 JSON body — it does not continue the chain.
- `AppConfig` defines role-based URL rules: `/admin/**` → ADMIN, `/teacher/**` and `/teacher-manage/**` → TEACHER, `/student/sub-mentor/**` → SUB_MENTOR, `/student/**` → STUDENT; everything else requires authentication. Method security (`@EnableMethodSecurity`) is also enabled.
- The `WHITE_LIST` (permit-all) is the `/auth/*` endpoints plus `/public/about/**` and `/uploads/**`. Note two unauthenticated bootstrap/dev endpoints in that list: `/auth/setup-admin` and `/auth/reset-all-passwords` — the latter resets every account's password and must be removed or guarded before production.
- Roles come from `UserAccount.getAuthorities()`, which prefixes `ROLE_` onto the `UserRole` → `Role` → `UserRole` enum name. `UserAccount` implements `UserDetails` directly.
- There are three JWT token types (`TokenType`: access / refresh / reset-password), each signed with its own key and expiry (`jwt.*` in `application.yml`).

### Response and error conventions

- Every controller returns the envelope `ResponseData<T>` (`{status, message, data}`), where `status` repeats the HTTP status code; `ResponseError`/`ResponseFailure` are the error variants of the same shape.
- `GlobalExceptionHandler` (`@RestControllerAdvice`) maps validation, auth, and not-found exceptions into that same envelope. Custom exceptions: `InvalidDataException`, `ResourceNotFoundException`.
- User-facing messages and code comments are a mix of Vietnamese and English; match the surrounding style.

### Persistence conventions

- Entities live in `entity/`, share `AbstractEntity` (`createdAt`/`updatedAt` via Hibernate timestamps).
- Enums (in `utils/enums/`) are mapped with `@Enumerated(EnumType.STRING)` to varchar columns. Do **not** use `@JdbcTypeCode(NAMED_ENUM)` / `columnDefinition = "e_xxx"` — that approach was deliberately removed because named Postgres enum types require manual `CREATE TYPE` and break on fresh databases.
- Soft deletes use an `isDeleted` boolean defaulting to `false` across all entities (including `LearningNode` and `NodeMaterial`, whose defaults were previously `true` — a footgun now removed; every creation site already set `isDeleted(false)` explicitly).
- Custom Bean Validation annotations are split between `dto/validator/` (annotations) and `utils/` (their validator implementations), e.g. `@EnumPattern`, `@PhoneNumber`, `@GenderSubset`.

### DTO conventions

Request DTOs in `dto/req/`, response DTOs in `dto/res/`. Controllers validate with `@Valid` and are organized by audience: `controller/admin/`, `controller/teacher/`, `controller/auth/`, plus shared root-level controllers (student-facing and general).

## Domain model

Two things in the schema are worth understanding before editing domain code: the classroom/subject hierarchy, and the adaptive learning-path graph (the most complex, most actively-developed subsystem).

### Classroom / subject hierarchy

- `Subject` is the catalog entity. `Subject.learningpathLength` = number of stages in its path (bounds a node's `stageOrder`, 1..length).
- `Classroom` ✕ `Subject` is joined by `ClassroomSubject` (one subject taught in one class), which also holds the `lecturer` and `quizStart` (the placement/entry quiz `Test` for that lesson).
- `ClassroomSubjectStudent` = a student's enrollment in a class-subject; `ClassroomSubMentor` = sub-mentor assignment.
- Students are imported in bulk from Excel via `StudentImportService` (Apache POI).

### Adaptive learning-path graph

A learning path is a directed graph of nodes that adapts to each student's ability level.

- **Templates vs clones** (`LearningPath`): `classroomSubject == null` → a template authored per subject. When published to a lesson it is cloned with `classroomSubject` set and `originalPath` pointing back at the template (`publishedAt`/`publishedBy` track publication).
- **Nodes** (`LearningNode`): belong to a path. `nodeType` is `AT_HOME`/`ON_CLASS`. `stageOrder` = which stage. `level` = `null` for nodes common to all levels, or `1`=Yếu (weak) / `2`=TB (medium) / `3`=Khá (good) for level-specific branches. `testKind` (`NodeTestKind`) is the key field:
  - `NONE` — a normal content node.
  - `PLACEMENT` — entry test that assigns the student's initial level (thresholds `placementYeuMax`/`placementTbMax`).
  - `GATE` — mid-path checkpoint that reroutes by score (`gateUpMin` → move up a level, `gateDownMax` → move down, in between → stay).
  - `FREE_CHOICE` — an optional test the student chooses to take to change level.
  - `appliesLevels` is a CSV of the levels that take a given test.
- **Edges** (`NodeEdge`): directed `fromNode`→`toNode`, unique per pair, with optional `minScore`/`maxScore` gating. Edge wiring is **deterministic** — the editor recomputes the desired edge set and rewires the whole path (`computeDesiredEdges` / `rewireAll` in the path service) rather than mutating edges ad hoc, paired with a stage-based layout.
- **Per-student state**:
  - `StudentNodeProgress` (unique per student+node+path): `status` (`LOCKED`/`OPEN`/`IN_PROGRESS`/`COMPLETED`), `orderIndex` for routing, and `testLocked` (node is OPEN but its test is held until the student redoes a remedial sub-branch).
  - `StudentLearningRoute` records which edge a student was routed through (route audit).
  - `StudentLevelHistory` logs every level change in a class-subject (`oldLevel`→`newLevel`, `reason` = `LevelChangeReason`: `PLACEMENT`/`GATE`/`RETAKE`/`FREE_CHOICE`).
- **Routing services**: `LevelRoutingService` maps a quiz percentage to a level via score bands (`QuizScoreBand`) and applies the three transitions (`assignInitialLevel`, `applyGateRouting`, `applyFreeChoiceRouting`). `LearningPathService`/`NodeEdgeService` manage the graph; `StudentProgressService` opens/locks nodes; `StudentTestService` scores attempts and triggers routing; `PlacementService`/`TeacherPlacementService` drive the entry-test flow.

### Tests / quizzes and node content

- Quiz model: `Test` → `TestQuestion` → `TestAnswer`; attempts are `StudentTestAttempt` → `StudentTestResponse`/`QuestionAnswer` (`AttemptStatus`, `SubmissionStatus`, `QuestionType`). `QuizScoreBand` maps score ranges to levels for routing.
- Node content: `NodeMaterial`, `NodeQuestion`, `NodeReview`, plus uploaded media (`FileEntity`, `Video`). Uploaded files are stored on disk under `uploads/` and served as static resources at `/uploads/**` (`MAX_UPLOAD_SIZE`, default 10MB, caps upload size).
- Support tickets: `SupportTicket` + `TicketComment` (`TicketLevel`, `TicketStatus`).

## Agentic Coding & Best Practices

To ensure high-quality, logic-driven, and robust code modifications, always adhere to the following practices:

- **Incremental Edits**: Avoid modifying entire files or replacing large sections unless necessary. Target precise lines and code blocks using standard diff-replacement tools.
- **Verification & Testing**: After any code change, verify the changes by running Maven tests or building the project (`mvn clean package` or `mvn test` in the `fedu/` directory). Never mark a task as complete without verifying it works.
- **Strict Error Handling**: Write defensive code. In Java, use custom exceptions like `ResourceNotFoundException` or `InvalidDataException` and rely on `@RestControllerAdvice` for global error mapping. Always ensure inputs are validated with `@Valid` or specific constraints.
- **Database Integrity**: Since `ddl-auto` is `none`, any database schema modifications must be updated in `fedu/fedudb_script.sql`. Ensure custom JPA entities map exactly to their SQL definition. Do not use named Postgres enums.
- **DTO Isolation**: Never expose entity models directly to controller endpoints. Always map entities to/from DTOs (using builders or mapper utilities) to preserve API-domain isolation.
- **Environment Parity**: Always ensure any environment-specific properties (e.g. database host, mail servers, CORS origins) are configurable via environment variables in `application.yml` and `.env` for Docker/production deployment parity.
- **Docker Deployment Parity**: Every time a code modification is completed, automatically update and restart the services inside the Docker environment to keep them synchronized. For backend changes, run `docker compose build backend` followed by `docker compose up -d backend`. For frontend changes, since the host folder is mounted as a volume, restart the service using `docker compose restart frontend` to reload Vite Dev Server cleanly.

## Frontend Design & Redesign System (Taste Skill)

This is the backend repo; frontend UI lives in the separate, untracked `SWP391_G1_FEdu_Fe/` checkout. When designing, refactoring, or modifying any frontend user interface, the agent **MUST read and apply** the premium anti-slop visual design guidelines in `.agent/rules/taste-skill.md` **first**, before making any edits, to keep all UI modifications consistent. (That rules file is not present in this backend checkout — look for it alongside the frontend project.)

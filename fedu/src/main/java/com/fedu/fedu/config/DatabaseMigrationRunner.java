package com.fedu.fedu.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseMigrationRunner implements CommandLineRunner {

    private final DataSource dataSource;

    @Override
    public void run(String... args) throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            
            try (Statement statement = connection.createStatement()) {
                statement.execute("ALTER TABLE user_account DROP CONSTRAINT IF EXISTS user_account_email_key");
                statement.execute("DROP INDEX IF EXISTS uk_user_account_email");
            } catch (Exception e) {
                log.warn("Could not drop email unique constraint: {}", e.getMessage());
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_user_account_active_email ON user_account (email) WHERE is_deleted = false");
                log.info("Partial unique index idx_user_account_active_email verified/created successfully.");
            } catch (Exception e) {
                log.warn("Could not create partial unique index idx_user_account_active_email: {}", e.getMessage());
            }
            
            
            boolean hasStatusColumn = false;
            try (ResultSet resultSet = metaData.getColumns(null, null, "subjects", "status")) {
                if (resultSet.next()) {
                    hasStatusColumn = true;
                }
            }
            
            if (!hasStatusColumn) {
                log.info("Column 'status' does not exist in 'subjects' table. Running migration...");
                try (Statement statement = connection.createStatement()) {
                    statement.execute("ALTER TABLE subjects ADD COLUMN status VARCHAR(50) DEFAULT 'draft'");
                    log.info("Migration successful: added 'status' column to 'subjects' table.");
                }
            } else {
                log.info("Column 'status' already exists in 'subjects' table.");
            }

            
            boolean hasClassroomStatusColumn = false;
            try (ResultSet resultSet = metaData.getColumns(null, null, "classrooms", "status")) {
                if (resultSet.next()) {
                    hasClassroomStatusColumn = true;
                }
            }

            if (!hasClassroomStatusColumn) {
                log.info("Column 'status' does not exist in 'classrooms' table. Running migration...");
                try (Statement statement = connection.createStatement()) {
                    statement.execute("ALTER TABLE classrooms ADD COLUMN status VARCHAR(50) DEFAULT 'inactive'");
                    
                    statement.execute("UPDATE classrooms SET status = 'active' WHERE classroom_id IN (SELECT DISTINCT cs.classroom_id FROM classroom_subjects cs JOIN classroom_subject_students css ON cs.id = css.classroom_subject_id)");
                    log.info("Migration successful: added 'status' column to 'classrooms' table and migrated legacy data.");
                }
            } else {
                log.info("Column 'status' already exists in 'classrooms' table. Ensuring legacy data is migrated...");
                try (Statement statement = connection.createStatement()) {
                    statement.execute("UPDATE classrooms SET status = 'active' WHERE classroom_id IN (SELECT DISTINCT cs.classroom_id FROM classroom_subjects cs JOIN classroom_subject_students css ON cs.id = css.classroom_subject_id) AND (status IS NULL OR status = 'inactive')");
                    log.info("Legacy classroom status check/update completed.");
                }
            }


            try (Statement statement = connection.createStatement()) {
                statement.execute("ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS term VARCHAR(20)");
                statement.execute("ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS academic_year INT");

                statement.execute("UPDATE classrooms SET term = 'SPRING' WHERE term IS NULL AND semester ILIKE '%spring%'");
                statement.execute("UPDATE classrooms SET term = 'SUMMER' WHERE term IS NULL AND semester ILIKE '%summer%'");
                statement.execute("UPDATE classrooms SET term = 'FALL' WHERE term IS NULL AND (semester ILIKE '%fall%' OR semester ILIKE '%autumn%')");
                statement.execute("UPDATE classrooms SET academic_year = CAST(substring(semester from '\\d{4}') AS INT) WHERE academic_year IS NULL AND semester ~ '\\d{4}'");
            } catch (Exception e) {
                log.warn("Could not migrate classroom term/academic_year: {}", e.getMessage());
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE TABLE IF NOT EXISTS semesters (" +
                        "semester_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, " +
                        "term VARCHAR(20) NOT NULL, " +
                        "academic_year INT NOT NULL, " +
                        "start_date DATE NOT NULL, " +
                        "end_date DATE NOT NULL, " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                        "CONSTRAINT uq_term_academic_year UNIQUE (term, academic_year)" +
                        ")");

                statement.execute("INSERT INTO semesters (term, academic_year, start_date, end_date) VALUES " +
                        "('SPRING', 2025, '2025-01-01', '2025-04-30'), " +
                        "('SUMMER', 2025, '2025-05-01', '2025-08-31'), " +
                        "('FALL', 2025, '2025-09-01', '2025-12-31'), " +
                        "('SPRING', 2026, '2026-01-01', '2026-04-30'), " +
                        "('SUMMER', 2026, '2026-05-01', '2026-08-31'), " +
                        "('FALL', 2026, '2026-09-01', '2026-12-31'), " +
                        "('SPRING', 2027, '2027-01-01', '2027-04-30'), " +
                        "('SUMMER', 2027, '2027-05-01', '2027-08-31'), " +
                        "('FALL', 2027, '2027-09-01', '2027-12-31'), " +
                        "('SPRING', 2028, '2028-01-01', '2028-04-30'), " +
                        "('SUMMER', 2028, '2028-05-01', '2028-08-31'), " +
                        "('FALL', 2028, '2028-09-01', '2028-12-31') " +
                        "ON CONFLICT (term, academic_year) DO NOTHING");

                log.info("Semesters table verified/created and pre-populated successfully.");
            } catch (Exception e) {
                log.warn("Could not create/populate semesters table: {}", e.getMessage());
            }


            boolean hasPublishedAt = false;
            try (ResultSet resultSet = metaData.getColumns(null, null, "learning_paths", "published_at")) {
                if (resultSet.next()) {
                    hasPublishedAt = true;
                }
            }
            if (!hasPublishedAt) {
                log.info("Columns 'published_at' and 'published_by' do not exist in 'learning_paths' table. Running migration...");
                try (Statement statement = connection.createStatement()) {
                    statement.execute("ALTER TABLE learning_paths ADD COLUMN published_at TIMESTAMP NULL");
                    statement.execute("ALTER TABLE learning_paths ADD COLUMN published_by BIGINT NULL REFERENCES user_account(user_id) ON DELETE SET NULL");
                    log.info("Migration successful: added 'published_at' and 'published_by' columns to 'learning_paths' table.");
                }
            }

            
            boolean hasDisplayOrder = false;
            try (ResultSet resultSet = metaData.getColumns(null, null, "learning_nodes", "display_order")) {
                if (resultSet.next()) {
                    hasDisplayOrder = true;
                }
            }
            if (!hasDisplayOrder) {
                log.info("Columns 'display_order', 'is_required' do not exist in 'learning_nodes' table. Running migration...");
                try (Statement statement = connection.createStatement()) {
                    statement.execute("ALTER TABLE learning_nodes ADD COLUMN display_order INT NOT NULL DEFAULT 0");
                    statement.execute("ALTER TABLE learning_nodes ADD COLUMN is_required BOOLEAN NOT NULL DEFAULT TRUE");
                    log.info("Migration successful: added display_order, is_required columns to 'learning_nodes'.");
                }
            }

            
            boolean hasOrderIndexInTests = false;
            try (ResultSet resultSet = metaData.getColumns(null, null, "tests", "order_index")) {
                if (resultSet.next()) {
                    hasOrderIndexInTests = true;
                }
            }
            if (!hasOrderIndexInTests) {
                log.info("Column 'order_index' does not exist in 'tests' table. Running migration...");
                try (Statement statement = connection.createStatement()) {
                    statement.execute("ALTER TABLE tests ADD COLUMN order_index INT NULL");
                    log.info("Migration successful: added 'order_index' column to 'tests' table.");
                }
            } else {
                log.info("Column 'order_index' already exists in 'tests' table.");
            }

            
            boolean hasNodeEdgesTable = false;
            try (ResultSet resultSet = metaData.getTables(null, null, "node_edges", null)) {
                if (resultSet.next()) {
                    hasNodeEdgesTable = true;
                }
            }
            if (!hasNodeEdgesTable) {
                log.info("Table 'node_edges' does not exist. Creating table...");
                try (Statement statement = connection.createStatement()) {
                    statement.execute(
                        "CREATE TABLE node_edges (" +
                        "    edge_id BIGSERIAL PRIMARY KEY," +
                        "    from_node_id BIGINT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE," +
                        "    to_node_id BIGINT NOT NULL REFERENCES learning_nodes(node_id) ON DELETE CASCADE," +
                        "    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                        "    UNIQUE(from_node_id, to_node_id)" +
                        ")"
                    );
                    log.info("Migration successful: created 'node_edges' table.");
                }
            }

            
            boolean hasStudentRoutesTable = false;
            try (ResultSet resultSet = metaData.getTables(null, null, "student_learning_routes", null)) {
                if (resultSet.next()) {
                    hasStudentRoutesTable = true;
                }
            }
            if (!hasStudentRoutesTable) {
                log.info("Table 'student_learning_routes' does not exist. Creating table...");
                try (Statement statement = connection.createStatement()) {
                    statement.execute(
                        "CREATE TABLE student_learning_routes (" +
                        "    id BIGSERIAL PRIMARY KEY," +
                        "    student_id BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE," +
                        "    edge_id BIGINT NOT NULL REFERENCES node_edges(edge_id) ON DELETE CASCADE," +
                        "    assigned_by BIGINT REFERENCES user_account(user_id) ON DELETE SET NULL," +
                        "    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                        ")"
                    );
                    log.info("Migration successful: created 'student_learning_routes' table.");
                }
            }

            
            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE INDEX IF NOT EXISTS idx_node_edges_from ON node_edges(from_node_id)");
                statement.execute("CREATE INDEX IF NOT EXISTS idx_node_edges_to ON node_edges(to_node_id)");
                statement.execute("CREATE INDEX IF NOT EXISTS idx_snp_path_status ON student_node_progress(path_id, status)");
                log.info("Indexes verified/created successfully.");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute("DROP INDEX IF EXISTS uniq_active_classroom_subject_level_path");
                statement.execute("ALTER TABLE classroom_subject_students DROP COLUMN IF EXISTS assigned_path_id");
                statement.execute("ALTER TABLE learning_paths DROP COLUMN IF EXISTS level");
                log.info("Dropped legacy columns: assigned_path_id, learning_paths.level.");
            }
            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_classroom_subject_path ON learning_paths(classroom_subject_id) WHERE classroom_subject_id IS NOT NULL AND is_deleted = FALSE");
            } catch (Exception e) {
                log.warn("Could not create uniq_active_classroom_subject_path: {}", e.getMessage());
            }

            
            try (Statement statement = connection.createStatement()) {
                statement.execute("ALTER TABLE student_node_progress DROP CONSTRAINT IF EXISTS student_node_progress_status_check");
                log.info("Status check constraint dropped/verified successfully.");
            }

            
            try (Statement statement = connection.createStatement()) {
                statement.execute("ALTER TABLE student_node_progress DROP COLUMN IF EXISTS test_locked");
                log.info("Column 'test_locked' dropped/verified from 'student_node_progress'.");
            }

            
            try (Statement statement = connection.createStatement()) {
                statement.execute("ALTER TABLE node_edges DROP COLUMN IF EXISTS min_score");
                statement.execute("ALTER TABLE node_edges DROP COLUMN IF EXISTS max_score");
                log.info("Columns 'min_score'/'max_score' dropped/verified from 'node_edges'.");
            }

            
            try (Statement statement = connection.createStatement()) {
                int rows = statement.executeUpdate("UPDATE student_node_progress SET status = 'OPEN' WHERE status = 'UNLOCKED'");
                if (rows > 0) {
                    log.info("Migration successful: updated {} progress records from 'UNLOCKED' to 'OPEN'.", rows);
                }
            }

            
            try (Statement statement = connection.createStatement()) {
                statement.execute("ALTER TABLE learning_nodes DROP COLUMN IF EXISTS branch_name");
                statement.execute("ALTER TABLE node_edges DROP COLUMN IF EXISTS branch_name");
                log.info("Columns 'branch_name' dropped from 'learning_nodes' and 'node_edges' successfully.");
            }

            try (Statement statement = connection.createStatement()) {
                
                statement.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS learningpath_length INT");
                
                statement.execute("ALTER TABLE learning_nodes ADD COLUMN IF NOT EXISTS stage_order INT");
                statement.execute("ALTER TABLE learning_nodes ADD COLUMN IF NOT EXISTS level INT");
                statement.execute("ALTER TABLE learning_nodes ADD COLUMN IF NOT EXISTS test_kind VARCHAR(20) DEFAULT 'NONE'");
                statement.execute("ALTER TABLE learning_nodes ADD COLUMN IF NOT EXISTS applies_levels VARCHAR(20)");
                statement.execute("ALTER TABLE learning_nodes ADD COLUMN IF NOT EXISTS gate_up_min DECIMAL(5,2)");
                statement.execute("ALTER TABLE learning_nodes ADD COLUMN IF NOT EXISTS gate_down_max DECIMAL(5,2)");
                statement.execute("ALTER TABLE learning_nodes ADD COLUMN IF NOT EXISTS placement_yeu_max DECIMAL(5,2)");
                statement.execute("ALTER TABLE learning_nodes ADD COLUMN IF NOT EXISTS placement_tb_max DECIMAL(5,2)");
                
                statement.execute("ALTER TABLE classroom_subjects ADD COLUMN IF NOT EXISTS id_quiz_start BIGINT REFERENCES tests(test_id) ON DELETE SET NULL");
                
                statement.execute("ALTER TABLE classroom_subject_students ADD COLUMN IF NOT EXISTS current_level INT");
                
                statement.execute("ALTER TABLE tests ALTER COLUMN node_id DROP NOT NULL");
                
                statement.execute("ALTER TABLE student_test_attempts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'SUBMITTED'");
                
                statement.execute("ALTER TABLE student_test_attempts ADD COLUMN IF NOT EXISTS tab_out_count INT DEFAULT 0");
                log.info("Adaptive placement: columns added/verified.");
            }

            
            try (Statement statement = connection.createStatement()) {
                statement.execute(
                    "CREATE TABLE IF NOT EXISTS quiz_score_bands (" +
                    "    band_id      BIGSERIAL PRIMARY KEY," +
                    "    test_id      BIGINT NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE," +
                    "    min_score    DECIMAL(5,2) NOT NULL," +
                    "    max_score    DECIMAL(5,2) NOT NULL," +
                    "    target_level INT NOT NULL," +
                    "    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                    "    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ")"
                );
                statement.execute("CREATE INDEX IF NOT EXISTS idx_quiz_score_bands_test ON quiz_score_bands(test_id)");
                log.info("Table 'quiz_score_bands' verified/created.");
            }

            
            try (Statement statement = connection.createStatement()) {
                statement.execute(
                    "CREATE TABLE IF NOT EXISTS student_level_history (" +
                    "    id                   BIGSERIAL PRIMARY KEY," +
                    "    student_id           BIGINT NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE," +
                    "    classroom_subject_id BIGINT NOT NULL REFERENCES classroom_subjects(id) ON DELETE CASCADE," +
                    "    old_level            INT," +
                    "    new_level            INT NOT NULL," +
                    "    reason               VARCHAR(50) NOT NULL," +
                    "    changed_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ")"
                );
                statement.execute("CREATE INDEX IF NOT EXISTS idx_slh_student_cs ON student_level_history(student_id, classroom_subject_id)");
                log.info("Table 'student_level_history' verified/created.");
            }

            boolean hasSnpCssCol = false;
            try (ResultSet rs = metaData.getColumns(null, null, "student_node_progress", "classroom_subject_student_id")) {
                if (rs.next()) hasSnpCssCol = true;
            }
            if (!hasSnpCssCol) {
                log.info("Migrating student_node_progress.student_id -> classroom_subject_student_id ...");
                try (Statement st = connection.createStatement()) {
                    st.execute("ALTER TABLE student_node_progress ADD COLUMN classroom_subject_student_id BIGINT");
                    
                    st.executeUpdate(
                        "UPDATE student_node_progress snp SET classroom_subject_student_id = css.id " +
                        "FROM classroom_subject_students css " +
                        "JOIN learning_paths lp ON lp.classroom_subject_id = css.classroom_subject_id " +
                        "WHERE lp.path_id = snp.path_id AND css.student_id = snp.student_id");
                    int orphans = st.executeUpdate("DELETE FROM student_node_progress WHERE classroom_subject_student_id IS NULL");
                    if (orphans > 0) {
                        log.warn("Deleted {} orphan student_node_progress rows (no matching enrollment).", orphans);
                    }
                    st.execute("ALTER TABLE student_node_progress ALTER COLUMN classroom_subject_student_id SET NOT NULL");
                    st.execute("ALTER TABLE student_node_progress ADD CONSTRAINT fk_snp_css " +
                        "FOREIGN KEY (classroom_subject_student_id) REFERENCES classroom_subject_students(id) ON DELETE CASCADE");
                    st.execute("ALTER TABLE student_node_progress DROP COLUMN student_id"); 
                    st.execute("ALTER TABLE student_node_progress ADD CONSTRAINT uq_snp_css_node_path " +
                        "UNIQUE (classroom_subject_student_id, node_id, path_id)");
                    log.info("Migration successful: student_node_progress now links classroom_subject_student.");
                }
            }

            
            boolean hasSlotsTable = false;
            try (ResultSet resultSet = metaData.getTables(null, null, "slots", null)) {
                if (resultSet.next()) {
                    hasSlotsTable = true;
                }
            }
            if (!hasSlotsTable) {
                log.info("Table 'slots' does not exist. Creating table...");
                try (Statement statement = connection.createStatement()) {
                    statement.execute(
                        "CREATE TABLE slots (" +
                        "    slot_id BIGSERIAL PRIMARY KEY," +
                        "    slot_name VARCHAR(50) NOT NULL UNIQUE," +
                        "    start_time TIME NOT NULL," +
                        "    end_time TIME NOT NULL," +
                        "    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                        "    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                        ")"
                    );
                    log.info("Migration successful: created 'slots' table.");
                }
                
                try (Statement statement = connection.createStatement()) {
                    statement.execute("INSERT INTO slots(slot_name, start_time, end_time) VALUES ('Slot 1', '07:30:00', '09:50:00') ON CONFLICT (slot_name) DO NOTHING");
                    statement.execute("INSERT INTO slots(slot_name, start_time, end_time) VALUES ('Slot 2', '10:00:00', '12:20:00') ON CONFLICT (slot_name) DO NOTHING");
                    statement.execute("INSERT INTO slots(slot_name, start_time, end_time) VALUES ('Slot 3', '12:50:00', '15:10:00') ON CONFLICT (slot_name) DO NOTHING");
                    statement.execute("INSERT INTO slots(slot_name, start_time, end_time) VALUES ('Slot 4', '15:20:00', '17:40:00') ON CONFLICT (slot_name) DO NOTHING");
                    statement.execute("INSERT INTO slots(slot_name, start_time, end_time) VALUES ('Slot 5', '17:50:00', '20:10:00') ON CONFLICT (slot_name) DO NOTHING");
                    statement.execute("INSERT INTO slots(slot_name, start_time, end_time) VALUES ('Slot 6', '20:20:00', '22:40:00') ON CONFLICT (slot_name) DO NOTHING");
                    log.info("Migration successful: seeded default slots.");
                }
            }

            
            boolean hasStudyDate = false;
            try (ResultSet resultSet = metaData.getColumns(null, null, "learning_nodes", "study_date")) {
                if (resultSet.next()) {
                    hasStudyDate = true;
                }
            }
            if (!hasStudyDate) {
                log.info("Columns 'study_date' and 'slot_id' do not exist in 'learning_nodes' table. Running migration...");
                try (Statement statement = connection.createStatement()) {
                    statement.execute("ALTER TABLE learning_nodes ADD COLUMN study_date DATE NULL");
                    statement.execute("ALTER TABLE learning_nodes ADD COLUMN slot_id BIGINT REFERENCES slots(slot_id) ON DELETE SET NULL");
                    log.info("Migration successful: added 'study_date' and 'slot_id' columns to 'learning_nodes' table.");
                }
            }

            
            try (Statement statement = connection.createStatement()) {
                statement.execute("ALTER TABLE learning_nodes ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMP NULL");
                statement.execute("ALTER TABLE student_node_progress ADD COLUMN IF NOT EXISTS completed_late BOOLEAN DEFAULT FALSE");
                statement.execute("UPDATE learning_nodes SET deadline_at = NULL WHERE node_type = 'ON_CLASS' AND deadline_at IS NOT NULL");
                log.info("Node deadline: columns 'deadline_at' (learning_nodes), 'completed_late' (student_node_progress) added/verified.");
            }

            
            
            try (Statement statement = connection.createStatement()) {
                statement.execute("ALTER TABLE learning_nodes ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMP NULL");
                statement.execute("ALTER TABLE learning_nodes ADD COLUMN IF NOT EXISTS session_ended_at TIMESTAMP NULL");
                
                statement.execute("ALTER TABLE tests ADD COLUMN IF NOT EXISTS release_ends_at TIMESTAMP NULL");
            }
            boolean hasReleasedAt = false;
            try (ResultSet resultSet = metaData.getColumns(null, null, "tests", "released_at")) {
                if (resultSet.next()) {
                    hasReleasedAt = true;
                }
            }
            if (!hasReleasedAt) {
                try (Statement statement = connection.createStatement()) {
                    statement.execute("ALTER TABLE tests ADD COLUMN released_at TIMESTAMP NULL");
                    
                    
                    statement.execute("UPDATE tests SET released_at = created_at WHERE released_at IS NULL");
                    log.info("Live session: added 'released_at' (tests) with one-time backfill.");
                }
            }

            
            boolean hasStudentMaterialProgressTable = false;
            try (ResultSet resultSet = metaData.getTables(null, null, "student_material_progress", null)) {
                if (resultSet.next()) {
                    hasStudentMaterialProgressTable = true;
                }
            }
            if (!hasStudentMaterialProgressTable) {
                log.info("Table 'student_material_progress' does not exist. Creating table...");
                try (Statement statement = connection.createStatement()) {
                    statement.execute(
                        "CREATE TABLE student_material_progress (" +
                        "    progress_id BIGSERIAL PRIMARY KEY," +
                        "    classroom_subject_student_id BIGINT NOT NULL REFERENCES classroom_subject_students(id) ON DELETE CASCADE," +
                        "    material_id BIGINT NOT NULL REFERENCES node_materials(material_id) ON DELETE CASCADE," +
                        "    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                        "    UNIQUE(classroom_subject_student_id, material_id)" +
                        ")"
                    );
                    log.info("Migration successful: created 'student_material_progress' table.");
                }
            }
        } catch (Exception e) {
            log.error("Failed to run database migration: {}", e.getMessage(), e);
        }
    }
}

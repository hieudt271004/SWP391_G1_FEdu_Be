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
            
            // Check if status column exists in subjects table
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

            // Check if status column exists in classrooms table
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
                    // Migrate legacy data
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

            // Check if published_at column exists in learning_paths table
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

            // Check if display_order column exists in learning_nodes table
            boolean hasDisplayOrder = false;
            try (ResultSet resultSet = metaData.getColumns(null, null, "learning_nodes", "display_order")) {
                if (resultSet.next()) {
                    hasDisplayOrder = true;
                }
            }
            if (!hasDisplayOrder) {
                log.info("Columns 'display_order', 'is_required', 'branch_name' do not exist in 'learning_nodes' table. Running migration...");
                try (Statement statement = connection.createStatement()) {
                    statement.execute("ALTER TABLE learning_nodes ADD COLUMN display_order INT NOT NULL DEFAULT 0");
                    statement.execute("ALTER TABLE learning_nodes ADD COLUMN is_required BOOLEAN NOT NULL DEFAULT TRUE");
                    statement.execute("ALTER TABLE learning_nodes ADD COLUMN branch_name VARCHAR(100)");
                    log.info("Migration successful: added display_order, is_required, branch_name columns to 'learning_nodes'.");
                }
            }

            // Check if node_edges table exists
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
                        "    branch_name VARCHAR(100)," +
                        "    min_score DECIMAL(5,2)," +
                        "    max_score DECIMAL(5,2)," +
                        "    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                        "    UNIQUE(from_node_id, to_node_id)" +
                        ")"
                    );
                    log.info("Migration successful: created 'node_edges' table.");
                }
            }

            // Check if student_learning_routes table exists
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

            // Create indexes if not exists
            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_classroom_path ON learning_paths(classroom_id) WHERE classroom_id IS NOT NULL AND is_deleted = FALSE");
                statement.execute("CREATE INDEX IF NOT EXISTS idx_node_edges_from ON node_edges(from_node_id)");
                statement.execute("CREATE INDEX IF NOT EXISTS idx_node_edges_to ON node_edges(to_node_id)");
                statement.execute("CREATE INDEX IF NOT EXISTS idx_snp_path_status ON student_node_progress(path_id, status)");
                log.info("Indexes verified/created successfully.");
            }

            // Update old 'UNLOCKED' student progress status to 'OPEN'
            try (Statement statement = connection.createStatement()) {
                int rows = statement.executeUpdate("UPDATE student_node_progress SET status = 'OPEN' WHERE status = 'UNLOCKED'");
                if (rows > 0) {
                    log.info("Migration successful: updated {} progress records from 'UNLOCKED' to 'OPEN'.", rows);
                }
            }
        } catch (Exception e) {
            log.error("Failed to run database migration: {}", e.getMessage(), e);
        }
    }
}

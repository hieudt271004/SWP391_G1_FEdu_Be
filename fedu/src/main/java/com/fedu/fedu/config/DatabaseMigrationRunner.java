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
        } catch (Exception e) {
            log.error("Failed to run database migration: {}", e.getMessage(), e);
        }
    }
}

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
        } catch (Exception e) {
            log.error("Failed to run database migration: {}", e.getMessage(), e);
        }
    }
}

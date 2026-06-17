package com.fedu.fedu.dto.req;

import com.fedu.fedu.utils.enums.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/** Một dòng sinh viên đọc từ file Excel import. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentImportRow {
    private String email;
    private String firstName;
    private String lastName;
    private Gender gender;
    private LocalDate dob;
    private String phone;
}

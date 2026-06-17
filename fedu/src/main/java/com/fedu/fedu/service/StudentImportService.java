package com.fedu.fedu.service;

import com.fedu.fedu.dto.res.ImportStudentsResult;
import org.springframework.web.multipart.MultipartFile;

public interface StudentImportService {

    /** Import sinh viên vào lớp-môn từ file Excel (.xlsx); trả báo cáo theo từng dòng. */
    ImportStudentsResult importStudents(Long classroomSubjectId, MultipartFile file);

    /** Sinh file Excel mẫu (header + 1 dòng ví dụ). */
    byte[] buildTemplate();
}

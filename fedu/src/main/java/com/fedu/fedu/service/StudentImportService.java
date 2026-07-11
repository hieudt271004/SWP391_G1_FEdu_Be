package com.fedu.fedu.service;

import com.fedu.fedu.dto.res.ImportStudentsResult;
import org.springframework.web.multipart.MultipartFile;

public interface StudentImportService {

    
    ImportStudentsResult importStudents(Long classroomSubjectId, MultipartFile file);

    
    byte[] buildTemplate();
}

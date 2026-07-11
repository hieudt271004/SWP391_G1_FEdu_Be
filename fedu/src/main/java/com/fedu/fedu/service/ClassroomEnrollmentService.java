package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.AddStudentRequest;
import com.fedu.fedu.dto.req.StudentImportRow;
import com.fedu.fedu.dto.res.StudentInClassResponse;

public interface ClassroomEnrollmentService {

    
    String DEFAULT_STUDENT_PASSWORD = "123456";

    StudentInClassResponse enrollStudent(Long classroomSubjectId, AddStudentRequest request);

    



    ImportRowResult enrollByImport(Long classroomSubjectId, StudentImportRow row);

    
    record ImportRowResult(boolean newAccount, boolean alreadyEnrolled) {}
}

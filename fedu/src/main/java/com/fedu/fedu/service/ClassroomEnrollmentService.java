package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.AddStudentRequest;
import com.fedu.fedu.dto.req.StudentImportRow;
import com.fedu.fedu.dto.res.StudentInClassResponse;

public interface ClassroomEnrollmentService {

    /** Mật khẩu mặc định cho tài khoản tạo từ import (dev — production nên đổi sang random per-user). */
    String DEFAULT_STUDENT_PASSWORD = "123456";

    StudentInClassResponse enrollStudent(Long classroomSubjectId, AddStudentRequest request);

    /**
     * Tạo (nếu chưa có) + enroll 1 dòng import trong transaction RIÊNG (REQUIRES_NEW),
     * để dòng lỗi không kéo đổ các dòng đã thành công.
     */
    ImportRowResult enrollByImport(Long classroomSubjectId, StudentImportRow row);

    /** Kết quả 1 dòng import: có tạo tài khoản mới không, và có bị bỏ qua vì đã ở trong lớp không. */
    record ImportRowResult(boolean newAccount, boolean alreadyEnrolled) {}
}

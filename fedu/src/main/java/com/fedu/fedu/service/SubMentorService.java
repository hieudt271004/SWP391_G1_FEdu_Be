package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.SubMentorStudentAssignmentRequest;
import com.fedu.fedu.dto.res.SubMentorStudentAssignmentResponse;

import java.util.List;

/**
 * Quản lý phân công sub-mentor trong một lớp-môn.
 * Phân quyền ở tầng dữ liệu: kiểm lecturer sở hữu lớp-môn trong từng operation.
 */
public interface SubMentorService {

    /**
     * Bật cờ isSubmentor = true cho một học sinh trong lớp-môn.
     *
     * @param classroomSubjectId ID lớp-môn (để xác nhận lecturer phụ trách)
     * @param classroomSubjectStudentId ID bản ghi CSS của học sinh
     * @param lecturerId userId của giảng viên đang thực hiện
     */
    void enableSubMentor(Long classroomSubjectId, Long classroomSubjectStudentId, Long lecturerId);

    /**
     * Tắt cờ isSubmentor = false cho một học sinh trong lớp-môn.
     *
     * @param classroomSubjectId ID lớp-môn
     * @param classroomSubjectStudentId ID bản ghi CSS của học sinh
     * @param lecturerId userId của giảng viên đang thực hiện
     */
    void disableSubMentor(Long classroomSubjectId, Long classroomSubjectStudentId, Long lecturerId);

    /**
     * Tạo bản ghi gán sub-mentor kèm học sinh.
     *
     * @param classroomSubjectId ID lớp-môn (để xác nhận cùng lớp-môn và lecturer)
     * @param request subMentorCssId + studentCssId
     * @param lecturerId userId của giảng viên đang thực hiện
     * @return thông tin assignment vừa tạo
     */
    SubMentorStudentAssignmentResponse createAssignment(Long classroomSubjectId,
                                                        SubMentorStudentAssignmentRequest request,
                                                        Long lecturerId);

    /**
     * Xóa bản ghi gán sub-mentor khỏi học sinh.
     *
     * @param classroomSubjectId ID lớp-môn
     * @param assignmentId ID bản ghi SubMentorStudentAssignment
     * @param lecturerId userId của giảng viên đang thực hiện
     */
    void deleteAssignment(Long classroomSubjectId, Long assignmentId, Long lecturerId);

    /**
     * Lấy danh sách tất cả assignment trong một lớp-môn (chỉ lecturer xem).
     */
    List<SubMentorStudentAssignmentResponse> listAssignments(Long classroomSubjectId, Long lecturerId);
}

package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.ClassroomRequest;
import com.fedu.fedu.dto.res.ClassroomResponse;
import com.fedu.fedu.dto.res.ClassroomSubjectResponse;
import com.fedu.fedu.dto.res.SubjectResponse;
import com.fedu.fedu.utils.enums.ClassroomStatus;

import java.util.List;

public interface ClassroomService {

    ClassroomResponse createClassroom(ClassroomRequest request);

    ClassroomResponse updateClassroom(Long classroomId, ClassroomRequest request);

    /** Đổi riêng trạng thái vòng đời lớp (bắt đầu/kết thúc) mà không đụng các field khác. */
    ClassroomResponse updateClassroomStatus(Long classroomId, ClassroomStatus status);

    void deleteClassroom(Long classroomId);

    ClassroomResponse getClassroomById(Long classroomId);

    List<ClassroomResponse> getAllClassrooms();

    List<ClassroomResponse> getClassroomsBySubject(Long subjectId);

    List<ClassroomResponse> getClassroomsByTeacher(long teacherId);

    List<ClassroomResponse> getClassroomsByStudent(long studentId);

    List<ClassroomSubjectResponse> getClassroomsByLecturerId(Long lecturerId);

    ClassroomSubjectResponse getClassroomSubjectById(Long classroomSubjectId);

    List<SubjectResponse> getSubjectsByLecturerId(Long lecturerId);
}

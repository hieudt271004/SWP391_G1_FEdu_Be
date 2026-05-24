package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.AssignTeacherRequest;
import com.fedu.fedu.dto.req.ClassroomRequest;
import com.fedu.fedu.dto.res.ClassroomResponse;

import java.util.List;

public interface ClassroomService {

    ClassroomResponse createClassroom(ClassroomRequest request, long currentUserId);

    ClassroomResponse updateClassroom(Long classroomId, ClassroomRequest request);

    void deleteClassroom(Long classroomId);

    ClassroomResponse getClassroomById(Long classroomId);

    List<ClassroomResponse> getAllClassrooms();

    List<ClassroomResponse> getClassroomsBySubject(Long subjectId);

    List<ClassroomResponse> getClassroomsByTeacher(long teacherId);

    ClassroomResponse assignTeacher(Long classroomId, AssignTeacherRequest request);
}

package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.ClassroomRequest;
import com.fedu.fedu.dto.res.ClassroomResponse;
import com.fedu.fedu.dto.res.ClassroomResponse;
import com.fedu.fedu.dto.res.SubjectResponse;

import java.util.List;

public interface ClassroomService {

    ClassroomResponse createClassroom(ClassroomRequest request);

    ClassroomResponse updateClassroom(Long classroomId, ClassroomRequest request);

    void deleteClassroom(Long classroomId);

    ClassroomResponse getClassroomById(Long classroomId);

    List<ClassroomResponse> getAllClassrooms();

    List<ClassroomResponse> getClassroomsBySubject(Long subjectId);

    List<ClassroomResponse> getClassroomsByTeacher(long teacherId);

    List<ClassroomResponse> getClassroomsByStudent(long studentId);

    List<ClassroomResponse> getClassroomsByLecturerId(Long lecturerId);

    List<SubjectResponse> getSubjectsByLecturerId(Long lecturerId);
}

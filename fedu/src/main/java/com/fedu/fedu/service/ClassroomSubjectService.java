package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.AddClassroomSubjectRequest;
import com.fedu.fedu.dto.res.ClassroomSubjectResponse;
import java.util.List;

public interface ClassroomSubjectService {
    ClassroomSubjectResponse addSubjectToClassroom(Long classroomId, AddClassroomSubjectRequest req);
    List<ClassroomSubjectResponse> getSubjectsOfClassroom(Long classroomId);
    ClassroomSubjectResponse changeLecturer(Long classroomSubjectId, Long lecturerId);
    void removeClassroomSubject(Long classroomSubjectId);
}
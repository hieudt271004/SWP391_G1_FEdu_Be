package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.SubjectRequest;
import com.fedu.fedu.entity.Subject;

import java.util.List;

public interface SubjectService {

    Subject createSubject(SubjectRequest request, long createdByUserId);

    Subject updateSubject(Long subjectId, SubjectRequest request);

    void deleteSubject(Long subjectId);

    Subject getSubjectById(Long subjectId);

    List<Subject> getAllSubjects();

    List<Subject> getSubjectsByTeacher(long teacherId);
}

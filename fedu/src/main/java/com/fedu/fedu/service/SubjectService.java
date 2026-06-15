package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.SubjectRequest;
import com.fedu.fedu.dto.res.SubjectResponse;

import java.util.List;

public interface SubjectService {

    SubjectResponse createSubject(SubjectRequest request, long createdByUserId);
    SubjectResponse updateSubject(Long subjectId, SubjectRequest request);
    SubjectResponse publishSubject(Long subjectId);
    SubjectResponse unpublishSubject(Long subjectId);
    void deleteSubject(Long subjectId);
    SubjectResponse getSubjectById(Long subjectId);
    List<SubjectResponse> getAllSubjects();
    List<SubjectResponse> getSubjectsByTeacher(long teacherId);
}

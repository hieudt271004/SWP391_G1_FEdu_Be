package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.CreateSubmissionRequest;
import com.fedu.fedu.dto.req.GradeSubmissionRequest;
import com.fedu.fedu.dto.res.SubmissionResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;




public interface SubmissionService {

    SubmissionResponse submit(Long exerciseId, Long studentId, CreateSubmissionRequest request, MultipartFile file);


    SubmissionResponse getMySubmission(Long exerciseId, Long studentId);


    List<SubmissionResponse> getMySubmissionsForClassroomSubject(Long classroomSubjectId, Long studentId);

    
    List<SubmissionResponse> listForExercise(Long exerciseId, Long teacherId);

    SubmissionResponse grade(Long submissionId, Long teacherId, GradeSubmissionRequest request);
}

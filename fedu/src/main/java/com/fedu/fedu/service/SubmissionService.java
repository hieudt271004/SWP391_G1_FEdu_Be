package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.CreateSubmissionRequest;
import com.fedu.fedu.dto.req.GradeSubmissionRequest;
import com.fedu.fedu.dto.res.SubmissionResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Học sinh nộp bài tập thực hành (tự luận và/hoặc file); giảng viên chấm điểm + nhận xét.
 */
public interface SubmissionService {

    SubmissionResponse submit(Long exerciseId, Long studentId, CreateSubmissionRequest request, MultipartFile file);

    /** Bài nộp của chính học sinh cho một bài tập (null nếu chưa nộp). */
    SubmissionResponse getMySubmission(Long exerciseId, Long studentId);

    /** Danh sách bài nộp của một bài tập (cho giảng viên chấm). */
    List<SubmissionResponse> listForExercise(Long exerciseId, Long teacherId);

    SubmissionResponse grade(Long submissionId, Long teacherId, GradeSubmissionRequest request);
}

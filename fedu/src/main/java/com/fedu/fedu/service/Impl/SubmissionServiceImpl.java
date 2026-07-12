package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.CreateSubmissionRequest;
import com.fedu.fedu.dto.req.GradeSubmissionRequest;
import com.fedu.fedu.dto.res.SubmissionResponse;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.repository.NodeExerciseRepository;
import com.fedu.fedu.repository.SubmissionRepository;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.service.SubmissionService;
import com.fedu.fedu.utils.enums.SubmissionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionServiceImpl implements SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final NodeExerciseRepository nodeExerciseRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final UserAccountRepository userAccountRepository;

    private static final String UPLOAD_DIR = "uploads";

    @Override
    @Transactional
    public SubmissionResponse submit(Long exerciseId, Long studentId, CreateSubmissionRequest request, MultipartFile file) {
        NodeExercise exercise = getExercise(exerciseId);
        LearningNode node = exercise.getLearningNode();
        assertStudentEnrolledInNode(node, studentId);

        String text = request != null ? request.getContent() : null;
        boolean hasText = text != null && !text.trim().isEmpty();
        boolean hasFile = file != null && !file.isEmpty();

        if (!hasText && !hasFile) {
            throw new InvalidDataException("Bài nộp phải có nội dung tự luận hoặc file đính kèm.");
        }
        if (hasText && !Boolean.TRUE.equals(exercise.getAllowText())) {
            throw new InvalidDataException("Bài tập này không cho phép nộp tự luận.");
        }
        if (hasFile && !Boolean.TRUE.equals(exercise.getAllowFile())) {
            throw new InvalidDataException("Bài tập này không cho phép nộp file.");
        }

        
        Submission submission = submissionRepository
                .findByNodeExerciseExerciseIdAndStudentUserIdAndIsDeletedFalse(exerciseId, studentId)
                .orElseGet(() -> Submission.builder()
                        .nodeExercise(exercise)
                        .learningNode(node)
                        .student(getUser(studentId))
                        .isDeleted(false)
                        .build());

        submission.setTitle(exercise.getTitle());
        submission.setContent(hasText ? text : null);
        submission.setFileUrl(hasFile ? storeFile(file) : null);
        submission.setStatus(SubmissionStatus.SUBMITTED);
        submission.setSubmittedAt(LocalDateTime.now());
        
        submission.setGrade(null);
        submission.setFeedback(null);
        submission.setGradedBy(null);
        submission.setGradedAt(null);

        submissionRepository.save(submission);
        log.info("Student {} submitted exercise {}", studentId, exerciseId);
        return mapSubmission(submission);
    }

    @Override
    @Transactional(readOnly = true)
    public SubmissionResponse getMySubmission(Long exerciseId, Long studentId) {
        getExercise(exerciseId);
        return submissionRepository
                .findByNodeExerciseExerciseIdAndStudentUserIdAndIsDeletedFalse(exerciseId, studentId)
                .map(this::mapSubmission)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubmissionResponse> getMySubmissionsForClassroomSubject(Long classroomSubjectId, Long studentId) {
        return submissionRepository
                .findByStudentAndClassroomSubject(studentId, classroomSubjectId)
                .stream()
                .map(this::mapSubmission)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubmissionResponse> listForExercise(Long exerciseId, Long teacherId) {
        NodeExercise exercise = getExercise(exerciseId);
        assertTeacherOwnsNode(exercise.getLearningNode(), teacherId);
        return submissionRepository
                .findByNodeExerciseExerciseIdAndIsDeletedFalseOrderBySubmittedAtAsc(exerciseId)
                .stream()
                .map(this::mapSubmission)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SubmissionResponse grade(Long submissionId, Long teacherId, GradeSubmissionRequest request) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));
        NodeExercise exercise = submission.getNodeExercise();
        LearningNode node = exercise != null ? exercise.getLearningNode() : submission.getLearningNode();
        assertTeacherOwnsNode(node, teacherId);

        submission.setGrade(request.getGrade());
        submission.setFeedback(request.getFeedback());
        submission.setGradedBy(getUser(teacherId));
        submission.setGradedAt(LocalDateTime.now());
        submission.setStatus(SubmissionStatus.GRADED);
        submissionRepository.save(submission);
        log.info("Teacher {} graded submission {}", teacherId, submissionId);
        return mapSubmission(submission);
    }

    

    private NodeExercise getExercise(Long exerciseId) {
        NodeExercise exercise = nodeExerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found with id: " + exerciseId));
        if (Boolean.TRUE.equals(exercise.getIsDeleted())) {
            throw new ResourceNotFoundException("Exercise not found with id: " + exerciseId);
        }
        return exercise;
    }

    private UserAccount getUser(Long userId) {
        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    private ClassroomSubject resolveClassroomSubject(LearningNode node) {
        LearningPath path = node != null ? node.getLearningPath() : null;
        if (path == null || path.getClassroomSubject() == null) {
            throw new InvalidDataException("Bài học này không thuộc lớp-môn nào.");
        }
        return path.getClassroomSubject();
    }

    private void assertStudentEnrolledInNode(LearningNode node, Long studentId) {
        ClassroomSubject cs = resolveClassroomSubject(node);
        if (!classroomSubjectStudentRepository.existsByClassroomSubject_IdAndStudent_UserId(cs.getId(), studentId)) {
            throw new AccessDeniedException("Bạn không thuộc lớp-môn của bài học này.");
        }
    }

    private void assertTeacherOwnsNode(LearningNode node, Long teacherId) {
        ClassroomSubject cs = resolveClassroomSubject(node);
        if (cs.getLecturer() == null || cs.getLecturer().getUserId() != teacherId) {
            throw new AccessDeniedException("Bạn không phụ trách lớp-môn này.");
        }
    }

    private String storeFile(MultipartFile file) {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String cleanFileName = System.currentTimeMillis() + "_" + original.replaceAll("[^a-zA-Z0-9._-]", "_");
            Path filePath = uploadPath.resolve(cleanFileName);
            Files.write(filePath, file.getBytes());
            log.info("Saved submission file to: {}", filePath.toAbsolutePath());
            return "/uploads/" + cleanFileName;
        } catch (IOException e) {
            log.error("Failed to store submission file", e);
            throw new InvalidDataException("Không lưu được file. Lỗi: " + e.getMessage());
        }
    }

    private SubmissionResponse mapSubmission(Submission s) {
        UserAccount student = s.getStudent();
        UserAccount grader = s.getGradedBy();
        NodeExercise ex = s.getNodeExercise();
        return SubmissionResponse.builder()
                .submissionId(s.getSubmissionId())
                .exerciseId(ex != null ? ex.getExerciseId() : null)
                .nodeId(s.getLearningNode() != null ? s.getLearningNode().getNodeId() : null)
                .studentId(student != null ? student.getUserId() : null)
                .studentName(fullName(student))
                .content(s.getContent())
                .fileUrl(s.getFileUrl())
                .status(s.getStatus() != null ? s.getStatus().name() : null)
                .grade(s.getGrade())
                .feedback(s.getFeedback())
                .gradedById(grader != null ? grader.getUserId() : null)
                .gradedByName(fullName(grader))
                .submittedAt(s.getSubmittedAt())
                .gradedAt(s.getGradedAt())
                .build();
    }

    private String fullName(UserAccount u) {
        if (u == null) return null;
        return (u.getFirstName() + " " + u.getLastName()).trim();
    }
}

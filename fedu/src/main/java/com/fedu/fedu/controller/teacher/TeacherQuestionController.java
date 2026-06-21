package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.req.QuestionRequest;
import com.fedu.fedu.dto.res.QuestionResponse;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.entity.Test;
import com.fedu.fedu.entity.TestQuestion;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomSubjectRepository;
import com.fedu.fedu.repository.TestQuestionRepository;
import com.fedu.fedu.repository.TestRepository;
import com.fedu.fedu.service.QuestionManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@Validated
@RestController
@RequestMapping("/teacher-manage")
@RequiredArgsConstructor
@Tag(name = "Teacher Question Controller", description = "Quản lý câu hỏi trong bài test dành cho giảng viên")
public class TeacherQuestionController {

    private final QuestionManagementService questionManagementService;
    private final TestRepository testRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final ClassroomSubjectRepository classroomSubjectRepository;

    @Operation(summary = "Lấy danh sách câu hỏi của một bài test")
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/tests/{testId}/questions")
    public ResponseData<List<QuestionResponse>> getQuestions(
            @PathVariable Long testId,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Teacher {} requesting questions for test id: {}", currentUser.getUserId(), testId);
        validateTeacherOwnershipOfTest(testId, currentUser.getUserId());
        List<QuestionResponse> questions = questionManagementService.getQuestions(testId);
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy danh sách câu hỏi thành công", questions);
    }

    @Operation(summary = "Thêm câu hỏi mới vào bài test")
    @PreAuthorize("hasRole('TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/tests/{testId}/questions")
    public ResponseData<QuestionResponse> addQuestion(
            @PathVariable Long testId,
            @Valid @RequestBody QuestionRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Teacher {} adding question to test id: {}", currentUser.getUserId(), testId);
        validateTeacherOwnershipOfTest(testId, currentUser.getUserId());
        QuestionResponse question = questionManagementService.addQuestion(testId, request);
        return new ResponseData<>(HttpStatus.CREATED.value(), "Thêm câu hỏi thành công", question);
    }

    @Operation(summary = "Cập nhật câu hỏi và câu trả lời")
    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/test-questions/{questionId}")
    public ResponseData<QuestionResponse> updateQuestion(
            @PathVariable Long questionId,
            @Valid @RequestBody QuestionRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Teacher {} updating question id: {}", currentUser.getUserId(), questionId);
        validateTeacherOwnershipOfQuestion(questionId, currentUser.getUserId());
        QuestionResponse question = questionManagementService.updateQuestion(questionId, request);
        return new ResponseData<>(HttpStatus.OK.value(), "Cập nhật câu hỏi thành công", question);
    }

    @Operation(summary = "Xóa câu hỏi")
    @PreAuthorize("hasRole('TEACHER')")
    @DeleteMapping("/test-questions/{questionId}")
    public ResponseData<Void> deleteQuestion(
            @PathVariable Long questionId,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Teacher {} deleting question id: {}", currentUser.getUserId(), questionId);
        validateTeacherOwnershipOfQuestion(questionId, currentUser.getUserId());
        questionManagementService.deleteQuestion(questionId);
        return new ResponseData<>(HttpStatus.OK.value(), "Xóa câu hỏi thành công", null);
    }

    private void validateTeacherOwnershipOfTest(Long testId, Long teacherId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài test không tồn tại"));
        
        ClassroomSubject owning = classroomSubjectRepository.findByQuizStartTestId(test.getTestId())
                .orElse(null);
        if (owning == null && test.getLearningNode() != null
                && test.getLearningNode().getLearningPath() != null) {
            owning = test.getLearningNode().getLearningPath().getClassroomSubject();
        }
        
        if (owning != null && owning.getLecturer() != null
                && teacherId != null && owning.getLecturer().getUserId() != teacherId) {
            throw new AccessDeniedException("Bạn không phụ trách lớp-môn của bài test này");
        }
    }

    private void validateTeacherOwnershipOfQuestion(Long questionId, Long teacherId) {
        TestQuestion question = testQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Câu hỏi không tồn tại"));
        validateTeacherOwnershipOfTest(question.getTest().getTestId(), teacherId);
    }
}

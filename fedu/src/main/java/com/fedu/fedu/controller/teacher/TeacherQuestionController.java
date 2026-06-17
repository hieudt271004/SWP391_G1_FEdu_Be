package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.req.QuestionRequest;
import com.fedu.fedu.dto.res.QuestionResponse;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.service.QuestionManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@Validated
@RestController
@RequestMapping("/teacher-manage")
@RequiredArgsConstructor
@Tag(name = "Teacher Question Controller", description = "Endpoints for teachers to manage test questions")
public class TeacherQuestionController {

    private final QuestionManagementService questionManagementService;

    @Operation(summary = "Get list of questions in a test (Teacher)")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @GetMapping("/tests/{testId}/questions")
    public ResponseData<List<QuestionResponse>> getQuestions(@PathVariable Long testId) {
        log.info("Teacher request get questions for test id: {}", testId);
        List<QuestionResponse> questions = questionManagementService.getQuestions(testId);
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved test questions successfully", questions);
    }

    @Operation(summary = "Add new question to a test (Teacher)")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/tests/{testId}/questions")
    public ResponseData<QuestionResponse> addQuestion(
            @PathVariable Long testId,
            @Valid @RequestBody QuestionRequest request) {
        log.info("Teacher request add question to test id: {}", testId);
        QuestionResponse question = questionManagementService.addQuestion(testId, request);
        return new ResponseData<>(HttpStatus.CREATED.value(), "Question added successfully", question);
    }

    @Operation(summary = "Update question and answers (Teacher)")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @PutMapping("/test-questions/{questionId}")
    public ResponseData<QuestionResponse> updateQuestion(
            @PathVariable Long questionId,
            @Valid @RequestBody QuestionRequest request) {
        log.info("Teacher request update question id: {}", questionId);
        QuestionResponse question = questionManagementService.updateQuestion(questionId, request);
        return new ResponseData<>(HttpStatus.OK.value(), "Question updated successfully", question);
    }

    @Operation(summary = "Delete question (Teacher)")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @DeleteMapping("/test-questions/{questionId}")
    public ResponseData<Void> deleteQuestion(@PathVariable Long questionId) {
        log.info("Teacher request delete question id: {}", questionId);
        questionManagementService.deleteQuestion(questionId);
        return new ResponseData<>(HttpStatus.OK.value(), "Question deleted successfully");
    }
}

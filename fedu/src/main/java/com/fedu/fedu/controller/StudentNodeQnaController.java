package com.fedu.fedu.controller;

import com.fedu.fedu.dto.req.CreateNodeQuestionRequest;
import com.fedu.fedu.dto.res.NodeQuestionResponse;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.NodeQnaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@Validated
@RestController
@RequestMapping("/student")
@RequiredArgsConstructor
@Tag(name = "Student Node Q&A Controller", description = "Học sinh đặt câu hỏi và xem hỏi đáp công khai trên node")
public class StudentNodeQnaController {

    private final NodeQnaService nodeQnaService;

    @Operation(summary = "Xem hỏi đáp công khai của một node (trong phạm vi lớp-môn)")
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/learning-nodes/{nodeId}/questions")
    public ResponseData<List<NodeQuestionResponse>> getQuestions(
            @PathVariable Long nodeId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy danh sách hỏi đáp thành công",
                nodeQnaService.getQuestionsForStudent(nodeId, currentUser.getUserId()));
    }

    @Operation(summary = "Đặt câu hỏi trên một node")
    @PreAuthorize("hasRole('STUDENT')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/learning-nodes/{nodeId}/questions")
    public ResponseData<NodeQuestionResponse> ask(
            @PathVariable Long nodeId,
            @Valid @RequestBody CreateNodeQuestionRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Student {} asks question on node {}", currentUser.getUserId(), nodeId);
        return new ResponseData<>(HttpStatus.CREATED.value(), "Đặt câu hỏi thành công",
                nodeQnaService.askQuestion(nodeId, currentUser.getUserId(), request));
    }

    @Operation(summary = "Sửa câu hỏi của chính mình")
    @PreAuthorize("hasRole('STUDENT')")
    @PutMapping("/questions/{questionId}")
    public ResponseData<NodeQuestionResponse> update(
            @PathVariable Long questionId,
            @Valid @RequestBody CreateNodeQuestionRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Cập nhật câu hỏi thành công",
                nodeQnaService.updateQuestion(questionId, currentUser.getUserId(), request));
    }

    @Operation(summary = "Xóa câu hỏi của chính mình")
    @PreAuthorize("hasRole('STUDENT')")
    @DeleteMapping("/questions/{questionId}")
    public ResponseData<Void> delete(
            @PathVariable Long questionId,
            @AuthenticationPrincipal UserAccount currentUser) {
        nodeQnaService.deleteQuestion(questionId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Xóa câu hỏi thành công");
    }
}

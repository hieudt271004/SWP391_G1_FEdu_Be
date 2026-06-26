package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.req.CreateQuestionAnswerRequest;
import com.fedu.fedu.dto.res.NodeQuestionResponse;
import com.fedu.fedu.dto.res.QuestionAnswerResponse;
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
@RequestMapping("/teacher-manage")
@RequiredArgsConstructor
@Tag(name = "Teacher Node Q&A Controller", description = "Giảng viên trả lời câu hỏi của học sinh trên node")
public class TeacherNodeQnaController {

    private final NodeQnaService nodeQnaService;

    @Operation(summary = "Xem hỏi đáp của một node mình phụ trách")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @GetMapping("/learning-nodes/{nodeId}/questions")
    public ResponseData<List<NodeQuestionResponse>> getQuestions(
            @PathVariable Long nodeId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy danh sách hỏi đáp thành công",
                nodeQnaService.getQuestionsForTeacher(nodeId, currentUser.getUserId()));
    }

    @Operation(summary = "Trả lời một câu hỏi của học sinh")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/questions/{questionId}/answers")
    public ResponseData<QuestionAnswerResponse> answer(
            @PathVariable Long questionId,
            @Valid @RequestBody CreateQuestionAnswerRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Teacher {} answers question {}", currentUser.getUserId(), questionId);
        return new ResponseData<>(HttpStatus.CREATED.value(), "Trả lời câu hỏi thành công",
                nodeQnaService.answerQuestion(questionId, currentUser.getUserId(), request));
    }

    @Operation(summary = "Sửa câu trả lời của chính mình")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @PutMapping("/answers/{answerId}")
    public ResponseData<QuestionAnswerResponse> updateAnswer(
            @PathVariable Long answerId,
            @Valid @RequestBody CreateQuestionAnswerRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Cập nhật câu trả lời thành công",
                nodeQnaService.updateAnswer(answerId, currentUser.getUserId(), request));
    }

    @Operation(summary = "Xóa câu trả lời của chính mình")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @DeleteMapping("/answers/{answerId}")
    public ResponseData<Void> deleteAnswer(
            @PathVariable Long answerId,
            @AuthenticationPrincipal UserAccount currentUser) {
        nodeQnaService.deleteAnswer(answerId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Xóa câu trả lời thành công");
    }
}

package com.fedu.fedu.controller;

import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.entity.StudentNodeProgress;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.LearningNodeRepository;
import com.fedu.fedu.repository.StudentNodeProgressRepository;
import com.fedu.fedu.service.NodeContentService;
import com.fedu.fedu.service.StudentProgressService;
import com.fedu.fedu.utils.enums.StudentProgressStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Slf4j
@Validated
@RestController
@RequestMapping("/student")
@RequiredArgsConstructor
@Tag(name = "Student Learning Path Controller", description = "Endpoints for students to access learning paths and node content")
public class StudentLearningPathController {

    private final StudentProgressService studentProgressService;
    private final NodeContentService nodeContentService;
    private final LearningNodeRepository learningNodeRepository;
    private final StudentNodeProgressRepository studentNodeProgressRepository;
    private final com.fedu.fedu.service.StudentTestService studentTestService;
    private final com.fedu.fedu.service.LiveSessionService liveSessionService;

    @Operation(summary = "Trạng thái buổi học live của node ON_CLASS (student polling ~5s)")
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/classroom-subjects/{csId}/learning-nodes/{nodeId}/live-state")
    public ResponseData<LiveSessionStateResponse> getLiveState(
            @PathVariable Long csId,
            @PathVariable Long nodeId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy trạng thái buổi học thành công",
                liveSessionService.getStudentState(csId, nodeId, currentUser.getUserId()));
    }

    @Operation(summary = "Get published classroom graph with student progress")
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/classroom-subjects/{classroomSubjectId}/graph")
    public ResponseData<ClassroomGraphResponse> getStudentClassroomGraph(
            @PathVariable Long classroomSubjectId,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Student ID {} requests graph for classroom-subject id: {}", currentUser.getUserId(), classroomSubjectId);
        ClassroomGraphResponse graph = studentProgressService.getStudentClassroomGraph(classroomSubjectId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved roadmap graph successfully", graph);
    }

    @Operation(summary = "Get content of an unlocked node")
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/learning-nodes/{nodeId}/content")
    public ResponseData<NodeContentResponse> getStudentNodeContent(
            @PathVariable Long nodeId,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Student ID {} requests content for node id: {}", currentUser.getUserId(), nodeId);

        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning node not found"));

        // Check student node progress status
        StudentNodeProgress progress = studentNodeProgressRepository
                .findByStudentUserIdAndLearningPathPathId(currentUser.getUserId(), node.getLearningPath().getPathId())
                .stream()
                .filter(p -> p.getLearningNode().getNodeId().equals(nodeId))
                .findFirst()
                .orElse(null);

        if (progress == null || progress.getStatus() == StudentProgressStatus.LOCKED) {
            throw new AccessDeniedException("Bài học này hiện đang bị khóa");
        }

        // Auto transition OPEN -> IN_PROGRESS on first access
        if (progress.getStatus() == StudentProgressStatus.OPEN) {
            progress.setStatus(StudentProgressStatus.IN_PROGRESS);
            studentNodeProgressRepository.save(progress);
        }

        NodeContentResponse content = nodeContentService.getNodeContent(nodeId);
        // Đề đã soạn nhưng chưa phát (releasedAt null) không hiện với học sinh
        if (content.getTests() != null) {
            content.getTests().removeIf(t -> t.getReleasedAt() == null);
        }
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved node content successfully", content);
    }

    @Operation(summary = "Complete a content node (node without tests) and unlock eligible next nodes")
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/learning-nodes/{nodeId}/complete")
    public ResponseData<Void> completeNode(
            @PathVariable Long nodeId,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Student ID {} completes node id: {}", currentUser.getUserId(), nodeId);
        studentTestService.completeNode(nodeId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Đã hoàn thành bài học");
    }
    @Operation(summary = "Complete a material (video/pdf) within a node")
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/learning-materials/{materialId}/complete")
    public ResponseData<Void> completeMaterial(
            @PathVariable Long materialId,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Student ID {} completes material id: {}", currentUser.getUserId(), materialId);
        studentProgressService.markMaterialAsCompleted(materialId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Đã đánh dấu hoàn thành học liệu");
    }

    @Operation(summary = "Get list of completed material IDs for current student")
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/learning-materials/completed")
    public ResponseData<java.util.List<Long>> getCompletedMaterials(
            @AuthenticationPrincipal UserAccount currentUser) {
        java.util.List<Long> completedIds = studentProgressService.getCompletedMaterialIds(currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved completed materials successfully", completedIds);
    }
}

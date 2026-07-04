package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.req.CreateNodeExerciseRequest;
import com.fedu.fedu.dto.req.CreateNodeMaterialRequest;
import com.fedu.fedu.dto.req.CreateNodeTestRequest;
import com.fedu.fedu.dto.req.ReorderContentRequest;
import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.entity.LearningPath;
import com.fedu.fedu.entity.NodeExercise;
import com.fedu.fedu.entity.NodeMaterial;
import com.fedu.fedu.entity.Test;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.LearningNodeRepository;
import com.fedu.fedu.repository.NodeExerciseRepository;
import com.fedu.fedu.repository.NodeMaterialRepository;
import com.fedu.fedu.repository.TestRepository;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.service.NodeContentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@Validated
@RestController
@RequestMapping("/teacher-manage")
@RequiredArgsConstructor
@Tag(name = "Teacher Node Content Controller", description = "APIs for lecturers to manage learning node content (materials and tests)")
public class TeacherNodeContentController {

    private final NodeContentService nodeContentService;
    private final LearningNodeRepository learningNodeRepository;
    private final NodeMaterialRepository nodeMaterialRepository;
    private final TestRepository testRepository;
    private final NodeExerciseRepository nodeExerciseRepository;
    private final UserAccountRepository userAccountRepository;

    private void validateTeacherOwnershipOfNode(Long nodeId) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return; // for tests/seeds
        UserAccount actor = userAccountRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("Unauthorized"));

        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning node not found with id: " + nodeId));

        LearningPath path = node.getLearningPath();
        if (path == null || path.getClassroomSubject() == null) {
            throw new AccessDeniedException("Node này không thuộc lộ trình lớp học");
        }

        if (path.getClassroomSubject().getLecturer() == null ||
                path.getClassroomSubject().getLecturer().getUserId() != actor.getUserId()) {
            throw new AccessDeniedException("Bạn không phụ trách lớp-môn này");
        }
    }

    /**
     * Cho phép XEM (read-only) nội dung node: node của TEMPLATE (dùng chung, chưa clone về lớp)
     * hoặc node clone thuộc lớp-môn teacher phụ trách. Dùng cho endpoint GET (preview lộ trình mẫu).
     */
    private void assertTeacherCanViewNode(Long nodeId) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning node not found with id: " + nodeId));
        LearningPath path = node.getLearningPath();
        if (path == null) {
            throw new AccessDeniedException("Node không hợp lệ");
        }
        // Node template (chưa clone) → catalog dùng chung, cho xem để preview.
        if (path.getClassroomSubject() == null) {
            return;
        }
        // Node clone → phải là lớp-môn teacher phụ trách.
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return; // test/seed
        UserAccount actor = userAccountRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("Unauthorized"));
        if (path.getClassroomSubject().getLecturer() == null ||
                path.getClassroomSubject().getLecturer().getUserId() != actor.getUserId()) {
            throw new AccessDeniedException("Bạn không phụ trách lớp-môn này");
        }
    }

    private void validateTeacherOwnershipOfMaterial(Long materialId) {
        NodeMaterial material = nodeMaterialRepository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Material not found with id: " + materialId));
        if (material.getLearningNode() == null) {
            throw new AccessDeniedException("Tài liệu không hợp lệ");
        }
        validateTeacherOwnershipOfNode(material.getLearningNode().getNodeId());
    }

    private void validateTeacherOwnershipOfTest(Long testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));
        if (test.getLearningNode() == null) {
            throw new AccessDeniedException("Bài kiểm tra không hợp lệ");
        }
        validateTeacherOwnershipOfNode(test.getLearningNode().getNodeId());
    }

    private void validateTeacherOwnershipOfExercise(Long exerciseId) {
        NodeExercise exercise = nodeExerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found with id: " + exerciseId));
        if (exercise.getLearningNode() == null) {
            throw new AccessDeniedException("Bài tập không hợp lệ");
        }
        validateTeacherOwnershipOfNode(exercise.getLearningNode().getNodeId());
    }

    @Operation(summary = "Get materials and tests for a specific node as teacher")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @GetMapping("/learning-nodes/{nodeId}/content")
    public ResponseData<NodeContentResponse> getNodeContent(@PathVariable Long nodeId) {
        log.info("Teacher retrieving content for learning node ID: {}", nodeId);
        assertTeacherCanViewNode(nodeId);
        return new ResponseData<>(HttpStatus.OK.value(), "Node content retrieved successfully",
                nodeContentService.getNodeContent(nodeId));
    }

    @Operation(summary = "Add learning material (video or file) to a node as teacher")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping(value = "/learning-nodes/{nodeId}/materials", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseData<NodeMaterialResponse> addMaterial(
            @PathVariable Long nodeId,
            @Valid @ModelAttribute CreateNodeMaterialRequest request,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        log.info("Teacher adding material to node ID: {}, title: {}", nodeId, request.getTitle());
        validateTeacherOwnershipOfNode(nodeId);
        return new ResponseData<>(HttpStatus.CREATED.value(), "Learning material added successfully",
                nodeContentService.addMaterial(nodeId, request, file));
    }

    @Operation(summary = "Delete learning material from a node as teacher")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @DeleteMapping("/materials/{materialId}")
    public ResponseData<Void> deleteMaterial(@PathVariable Long materialId) {
        log.info("Teacher deleting material ID: {}", materialId);
        validateTeacherOwnershipOfMaterial(materialId);
        nodeContentService.deleteMaterial(materialId);
        return new ResponseData<>(HttpStatus.OK.value(), "Learning material deleted successfully");
    }

    @Operation(summary = "Add test to a learning node as teacher")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/learning-nodes/{nodeId}/tests")
    public ResponseData<NodeTestResponse> addTest(
            @PathVariable Long nodeId,
            @Valid @RequestBody CreateNodeTestRequest request) {
        log.info("Teacher adding test to node ID: {}, title: {}", nodeId, request.getTitle());
        validateTeacherOwnershipOfNode(nodeId);
        return new ResponseData<>(HttpStatus.CREATED.value(), "Test added successfully",
                nodeContentService.addTest(nodeId, request));
    }

    @Operation(summary = "Delete test from a learning node as teacher")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @DeleteMapping("/tests/{testId}")
    public ResponseData<Void> deleteTest(@PathVariable Long testId) {
        log.info("Teacher deleting test ID: {}", testId);
        validateTeacherOwnershipOfTest(testId);
        nodeContentService.deleteTest(testId);
        return new ResponseData<>(HttpStatus.OK.value(), "Test deleted successfully");
    }

    @Operation(summary = "Add practice exercise to a learning node as teacher")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/learning-nodes/{nodeId}/exercises")
    public ResponseData<NodeExerciseResponse> addExercise(
            @PathVariable Long nodeId,
            @Valid @RequestBody CreateNodeExerciseRequest request) {
        log.info("Teacher adding exercise to node ID: {}, title: {}", nodeId, request.getTitle());
        validateTeacherOwnershipOfNode(nodeId);
        return new ResponseData<>(HttpStatus.CREATED.value(), "Exercise added successfully",
                nodeContentService.addExercise(nodeId, request));
    }

    @Operation(summary = "Delete practice exercise from a node as teacher")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @DeleteMapping("/exercises/{exerciseId}")
    public ResponseData<Void> deleteExercise(@PathVariable Long exerciseId) {
        log.info("Teacher deleting exercise ID: {}", exerciseId);
        validateTeacherOwnershipOfExercise(exerciseId);
        nodeContentService.deleteExercise(exerciseId);
        return new ResponseData<>(HttpStatus.OK.value(), "Exercise deleted successfully");
    }

    @Operation(summary = "Reorder materials, tests and exercises inside a learning node as teacher")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @PostMapping("/learning-nodes/{nodeId}/reorder-content")
    public ResponseData<Void> reorderContent(
            @PathVariable Long nodeId,
            @Valid @RequestBody List<ReorderContentRequest> requests) {
        log.info("Teacher reordering content for node ID: {}, items count: {}", nodeId, requests.size());
        validateTeacherOwnershipOfNode(nodeId);
        nodeContentService.reorderContent(nodeId, requests);
        return new ResponseData<>(HttpStatus.OK.value(), "Content reordered successfully");
    }
}

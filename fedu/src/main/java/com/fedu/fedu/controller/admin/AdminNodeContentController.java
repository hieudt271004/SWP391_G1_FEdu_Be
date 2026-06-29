package com.fedu.fedu.controller.admin;

import com.fedu.fedu.dto.req.CreateNodeExerciseRequest;
import com.fedu.fedu.dto.req.CreateNodeMaterialRequest;
import com.fedu.fedu.dto.req.CreateNodeTestRequest;
import com.fedu.fedu.dto.req.ReorderContentRequest;
import com.fedu.fedu.dto.res.*;
import java.util.List;
import com.fedu.fedu.service.NodeContentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Validated
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Node Content Controller", description = "APIs for administrator to manage roadmap node content (materials and tests)")
public class AdminNodeContentController {

    private final NodeContentService nodeContentService;

    @Operation(summary = "Get materials and tests for a specific node")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @GetMapping("/learning-nodes/{nodeId}/content")
    public ResponseData<NodeContentResponse> getNodeContent(@PathVariable Long nodeId) {
        log.info("Admin retrieving content for learning node ID: {}", nodeId);
        return new ResponseData<>(HttpStatus.OK.value(), "Node content retrieved successfully",
                nodeContentService.getNodeContent(nodeId));
    }

    @Operation(summary = "Add learning material (video or file) to a node")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping(value = "/learning-nodes/{nodeId}/materials", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseData<NodeMaterialResponse> addMaterial(
            @PathVariable Long nodeId,
            @Valid @ModelAttribute CreateNodeMaterialRequest request,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        log.info("Admin adding material to node ID: {}, title: {}", nodeId, request.getTitle());
        return new ResponseData<>(HttpStatus.CREATED.value(), "Learning material added successfully",
                nodeContentService.addMaterial(nodeId, request, file));
    }

    @Operation(summary = "Delete learning material from a node")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @DeleteMapping("/materials/{materialId}")
    public ResponseData<Void> deleteMaterial(@PathVariable Long materialId) {
        log.info("Admin deleting material ID: {}", materialId);
        nodeContentService.deleteMaterial(materialId);
        return new ResponseData<>(HttpStatus.OK.value(), "Learning material deleted successfully");
    }

    @Operation(summary = "Add test to a learning node")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/learning-nodes/{nodeId}/tests")
    public ResponseData<NodeTestResponse> addTest(
            @PathVariable Long nodeId,
            @Valid @RequestBody CreateNodeTestRequest request) {
        log.info("Admin adding test to node ID: {}, title: {}", nodeId, request.getTitle());
        return new ResponseData<>(HttpStatus.CREATED.value(), "Test added successfully",
                nodeContentService.addTest(nodeId, request));
    }

    @Operation(summary = "Delete test from a learning node")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @DeleteMapping("/tests/{testId}")
    public ResponseData<Void> deleteTest(@PathVariable Long testId) {
        log.info("Admin deleting test ID: {}", testId);
        nodeContentService.deleteTest(testId);
        return new ResponseData<>(HttpStatus.OK.value(), "Test deleted successfully");
    }

    @Operation(summary = "Add practice exercise to a learning node")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/learning-nodes/{nodeId}/exercises")
    public ResponseData<NodeExerciseResponse> addExercise(
            @PathVariable Long nodeId,
            @Valid @RequestBody CreateNodeExerciseRequest request) {
        log.info("Admin adding exercise to node ID: {}, title: {}", nodeId, request.getTitle());
        return new ResponseData<>(HttpStatus.CREATED.value(), "Exercise added successfully",
                nodeContentService.addExercise(nodeId, request));
    }

    @Operation(summary = "Delete practice exercise from a node")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @DeleteMapping("/exercises/{exerciseId}")
    public ResponseData<Void> deleteExercise(@PathVariable Long exerciseId) {
        log.info("Admin deleting exercise ID: {}", exerciseId);
        nodeContentService.deleteExercise(exerciseId);
        return new ResponseData<>(HttpStatus.OK.value(), "Exercise deleted successfully");
    }

    @Operation(summary = "Reorder materials, tests and exercises inside a learning node")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @PostMapping("/learning-nodes/{nodeId}/reorder-content")
    public ResponseData<Void> reorderContent(
            @PathVariable Long nodeId,
            @Valid @RequestBody List<ReorderContentRequest> requests) {
        log.info("Admin reordering content for node ID: {}, items count: {}", nodeId, requests.size());
        nodeContentService.reorderContent(nodeId, requests);
        return new ResponseData<>(HttpStatus.OK.value(), "Content reordered successfully");
    }
}

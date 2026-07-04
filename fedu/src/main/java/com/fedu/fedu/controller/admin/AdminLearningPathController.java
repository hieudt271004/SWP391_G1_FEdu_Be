package com.fedu.fedu.controller.admin;

import com.fedu.fedu.dto.req.*;
import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.service.LearningPathService;
import com.fedu.fedu.service.NodeEdgeService;
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
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Learning Path Controller", description = "APIs for administrator to manage subject learning path templates")
public class AdminLearningPathController {

    private final LearningPathService learningPathService;
    private final NodeEdgeService nodeEdgeService;

    @Operation(summary = "Get learning path templates by subject")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @GetMapping("/subjects/{subjectId}/learning-paths")
    public ResponseData<List<LearningPathResponse>> getTemplatesBySubjectId(@PathVariable Long subjectId) {
        log.info("Admin retrieving learning path templates for subject: {}", subjectId);
        return new ResponseData<>(HttpStatus.OK.value(), "Learning path templates retrieved successfully",
                learningPathService.getLearningPathsBySubjectId(subjectId));
    }

    @Operation(summary = "Create learning path template")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/learning-paths")
    public ResponseData<LearningPathResponse> createTemplate(@Valid @RequestBody CreateLearningPathRequest request) {
        log.info("Admin creating learning path template: {}", request.getPathName());
        return new ResponseData<>(HttpStatus.CREATED.value(), "Learning path template created successfully",
                learningPathService.createLearningPath(request));
    }

    @Operation(summary = "Update learning path template")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @PutMapping("/learning-paths/{pathId}")
    public ResponseData<LearningPathResponse> updateTemplate(@PathVariable Long pathId, @Valid @RequestBody UpdateLearningPathRequest request) {
        log.info("Admin updating learning path template ID: {}", pathId);
        return new ResponseData<>(HttpStatus.OK.value(), "Learning path template updated successfully",
                learningPathService.updateLearningPath(pathId, request));
    }

    @Operation(summary = "Delete learning path template")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @DeleteMapping("/learning-paths/{pathId}")
    public ResponseData<Void> deleteTemplate(@PathVariable Long pathId) {
        log.info("Admin deleting learning path template ID: {}", pathId);
        learningPathService.deleteLearningPath(pathId);
        return new ResponseData<>(HttpStatus.OK.value(), "Learning path template deleted successfully");
    }

    @Operation(summary = "Get template graph")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @GetMapping("/learning-paths/{pathId}/graph")
    public ResponseData<LearningPathGraphResponse> getTemplateGraph(@PathVariable Long pathId) {
        log.info("Admin retrieving template graph for path ID: {}", pathId);
        return new ResponseData<>(HttpStatus.OK.value(), "Learning path template graph retrieved successfully",
                learningPathService.getLearningPathGraph(pathId));
    }

    @Operation(summary = "Create learning node under template")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/learning-nodes")
    public ResponseData<LearningNodeResponse> createTemplateNode(@Valid @RequestBody CreateLearningNodeRequest request) {
        log.info("Admin creating learning node under template path ID: {}", request.getLearningPathId());
        return new ResponseData<>(HttpStatus.CREATED.value(), "Learning node created successfully",
                learningPathService.createLearningNode(request));
    }

    @Operation(summary = "Update learning node")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @PutMapping("/learning-nodes/{nodeId}")
    public ResponseData<LearningNodeResponse> updateTemplateNode(@PathVariable Long nodeId, @Valid @RequestBody UpdateLearningNodeRequest request) {
        log.info("Admin updating learning node ID: {}", nodeId);
        return new ResponseData<>(HttpStatus.OK.value(), "Learning node updated successfully",
                learningPathService.updateLearningNode(nodeId, request));
    }

    @Operation(summary = "Delete learning node")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @DeleteMapping("/learning-nodes/{nodeId}")
    public ResponseData<Void> deleteTemplateNode(@PathVariable Long nodeId) {
        log.info("Admin deleting learning node ID: {}", nodeId);
        learningPathService.deleteLearningNode(nodeId);
        return new ResponseData<>(HttpStatus.OK.value(), "Learning node deleted successfully");
    }

    @Operation(summary = "Create node edge connection")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/node-edges")
    public ResponseData<NodeEdgeResponse> createTemplateEdge(@Valid @RequestBody CreateNodeEdgeRequest request) {
        log.info("Admin creating node edge from {} to {}", request.getFromNodeId(), request.getToNodeId());
        return new ResponseData<>(HttpStatus.CREATED.value(), "Node edge created successfully",
                nodeEdgeService.createEdge(request));
    }

    @Operation(summary = "Delete node edge connection")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    @DeleteMapping("/node-edges/{edgeId}")
    public ResponseData<Void> deleteTemplateEdge(@PathVariable Long edgeId) {
        log.info("Admin deleting node edge ID: {}", edgeId);
        nodeEdgeService.deleteEdge(edgeId);
        return new ResponseData<>(HttpStatus.OK.value(), "Node edge deleted successfully");
    }

    @Operation(summary = "Publish template")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PostMapping("/learning-paths/{pathId}/publish")
    public ResponseData<LearningPathResponse> publishTemplate(@PathVariable Long pathId) {
        log.info("Admin publishing template ID: {}", pathId);
        return new ResponseData<>(HttpStatus.OK.value(), "Template published successfully",
                learningPathService.publishTemplate(pathId));
    }

    @Operation(summary = "Unpublish template")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @PostMapping("/learning-paths/{pathId}/unpublish")
    public ResponseData<LearningPathResponse> unpublishTemplate(@PathVariable Long pathId) {
        log.info("Admin unpublishing template ID: {}", pathId);
        return new ResponseData<>(HttpStatus.OK.value(), "Template unpublished successfully",
                learningPathService.unpublishTemplate(pathId));
    }
}

package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.req.*;
import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.service.LearningPathService;
import com.fedu.fedu.service.NodeContentService;
import com.fedu.fedu.service.NodeEdgeService;
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

import java.util.List;

@Slf4j
@Validated
@RestController
@RequestMapping("/teacher-manage")
@RequiredArgsConstructor
@Tag(name = "Teacher Management Controller", description = "APIs for lecturer to manage classrooms and subjects")
public class LearningPathManagementController {

        private final LearningPathService learningPathService;
        private final NodeContentService nodeContentService;
        private final NodeEdgeService nodeEdgeService;

        @Operation(summary = "Create learning path")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @ResponseStatus(HttpStatus.CREATED)
        @PostMapping("/learning-paths")
        public ResponseData<LearningPathResponse> createLearningPath(@Valid @RequestBody CreateLearningPathRequest request) {
            return new ResponseData<>(HttpStatus.CREATED.value(), "Learning path created successfully",
                    learningPathService.createLearningPath(request));
        }

        @Operation(summary = "Update learning path")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @PutMapping("/learning-paths/{pathId}")
        public ResponseData<LearningPathResponse> updateLearningPath(@PathVariable Long pathId, @Valid @RequestBody UpdateLearningPathRequest request) {
            return new ResponseData<>(HttpStatus.OK.value(), "Learning path updated successfully",
                    learningPathService.updateLearningPath(pathId, request));
        }

        @Operation(summary = "Delete learning path")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @DeleteMapping("/learning-paths/{pathId}")
        public ResponseData<Void> deleteLearningPath(@PathVariable Long pathId) {
            learningPathService.deleteLearningPath(pathId);
            return new ResponseData<>(HttpStatus.OK.value(), "Learning path deleted successfully");
        }

        @Operation(summary = "Get learning path by id")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/learning-paths/{pathId}")
        public ResponseData<LearningPathResponse> getLearningPathById(@PathVariable Long pathId) {
            return new ResponseData<>(HttpStatus.OK.value(), "Learning path retrieved successfully",
                    learningPathService.getLearningPathById(pathId));
        }

        @Operation(summary = "Get learning paths by subject")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/subjects/{subjectId}/learning-paths")
        public ResponseData<List<LearningPathResponse>> getLearningPathsBySubjectId(@PathVariable Long subjectId) {
            return new ResponseData<>(HttpStatus.OK.value(), "Learning paths retrieved successfully",
                    learningPathService.getLearningPathsBySubjectId(subjectId));
        }

        @Operation(summary = "Clone learning path to classroom")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @ResponseStatus(HttpStatus.CREATED)
        @PostMapping("/classrooms/{classroomId}/clone-learning-path/{pathId}")
        public ResponseData<LearningPathResponse> cloneLearningPath(@PathVariable Long classroomId, @PathVariable Long pathId) {
            return new ResponseData<>(HttpStatus.CREATED.value(), "Learning path cloned successfully",
                    learningPathService.cloneLearningPath(classroomId, pathId));
        }

        @Operation(summary = "Get classroom learning paths")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/classrooms/{classroomId}/learning-paths")
        public ResponseData<List<LearningPathResponse>> getClassroomLearningPaths(@PathVariable Long classroomId) {
            return new ResponseData<>(HttpStatus.OK.value(), "Classroom learning paths retrieved successfully",
                    learningPathService.getClassroomLearningPaths(classroomId));
        }

        @Operation(summary = "Create learning node")
        @ResponseStatus(HttpStatus.CREATED)
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @PostMapping("/learning-nodes")
        public ResponseData<LearningNodeResponse> createLearningNode(@Valid @RequestBody CreateLearningNodeRequest request) {
            return new ResponseData<>(HttpStatus.CREATED.value(), "Learning node created successfully",
                    learningPathService.createLearningNode(request));
        }

        @Operation(summary = "Update learning node")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @PutMapping("/learning-nodes/{nodeId}")
        public ResponseData<LearningNodeResponse> updateLearningNode(@PathVariable Long nodeId, @Valid @RequestBody UpdateLearningNodeRequest request) {
            return new ResponseData<>(HttpStatus.OK.value(), "Learning node updated successfully",
                    learningPathService.updateLearningNode(nodeId, request));
        }

        @Operation(summary = "Delete learning node")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @DeleteMapping("/learning-nodes/{nodeId}")
        public ResponseData<Void> deleteLearningNode(@PathVariable Long nodeId) {
            learningPathService.deleteLearningNode(nodeId);
            return new ResponseData<>(HttpStatus.OK.value(), "Learning node deleted successfully");
        }

        @Operation(summary = "Get learning node by id")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/learning-nodes/{nodeId}")
        public ResponseData<LearningNodeResponse> getLearningNodeById(@PathVariable Long nodeId) {
            return new ResponseData<>(HttpStatus.OK.value(), "Learning node retrieved successfully",
                    learningPathService.getLearningNodeById(nodeId));
        }

        @Operation(summary = "Get template nodes by path")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/learning-paths/{pathId}/nodes")
        public ResponseData<List<LearningNodeResponse>> getTemplateNodesByPathId(@PathVariable Long pathId) {
            return new ResponseData<>(HttpStatus.OK.value(), "Template nodes retrieved successfully",
                    learningPathService.getTemplateNodesByPathId(pathId));
        }

        @Operation(summary = "Get classroom nodes by classroom")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/classrooms/{classroomId}/learning-nodes")
        public ResponseData<List<LearningNodeResponse>> getClassroomNodesByClassroomId(@PathVariable Long classroomId) {
            return new ResponseData<>(HttpStatus.OK.value(), "Classroom nodes retrieved successfully",
                    learningPathService.getClassroomNodesByClassroomId(classroomId));
        }

        @Operation(summary = "Get learning path graph")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/learning-paths/{pathId}/graph")
        public ResponseData<LearningPathGraphResponse> getLearningPathGraph(@PathVariable Long pathId) {
            return new ResponseData<>(HttpStatus.OK.value(), "Learning path graph retrieved successfully",
                    learningPathService.getLearningPathGraph(pathId));
        }

        @Operation(summary = "Get classroom graph")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/classrooms/{classroomId}/graph")
        public ResponseData<ClassroomGraphResponse> getClassroomGraph(@PathVariable Long classroomId) {
            return new ResponseData<>(HttpStatus.OK.value(), "Classroom graph retrieved successfully",
                    learningPathService.getClassroomGraph(classroomId));
        }

        @Operation(summary = "Publish classroom learning path")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @PostMapping("/classrooms/{classroomId}/learning-paths/{pathId}/publish")
        public ResponseData<PublishResultResponse> publishClassroomPath(@PathVariable Long classroomId, @PathVariable Long pathId) {
            return new ResponseData<>(HttpStatus.OK.value(), "Lộ trình đã được publish thành công",
                    learningPathService.publishClassroomPath(classroomId, pathId));
        }

        @Operation(summary = "Unpublish classroom learning path")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @PostMapping("/classrooms/{classroomId}/learning-paths/{pathId}/unpublish")
        public ResponseData<Void> unpublishClassroomPath(@PathVariable Long classroomId, @PathVariable Long pathId) {
            learningPathService.unpublishClassroomPath(classroomId, pathId);
            return new ResponseData<>(HttpStatus.OK.value(), "Lộ trình đã được unpublish thành công");
        }

        @Operation(summary = "Delete draft learning path")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @DeleteMapping("/classrooms/{classroomId}/learning-paths/{pathId}")
        public ResponseData<Void> deleteDraftPath(@PathVariable Long classroomId, @PathVariable Long pathId) {
            learningPathService.deleteDraftPath(classroomId, pathId);
            return new ResponseData<>(HttpStatus.OK.value(), "Lộ trình nháp đã được xóa thành công");
        }

        @Operation(summary = "Delete node edge")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @DeleteMapping("/node-edges/{edgeId}")
        public ResponseData<Void> deleteNodeEdge(@PathVariable Long edgeId) {
            nodeEdgeService.deleteEdge(edgeId);
            return new ResponseData<>(HttpStatus.OK.value(), "Node edge deleted successfully");
        }

        @Operation(summary = "Create node edge connection")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @ResponseStatus(HttpStatus.CREATED)
        @PostMapping("/node-edges")
        public ResponseData<NodeEdgeResponse> createNodeEdgeConnection(@Valid @RequestBody CreateNodeEdgeRequest request) {
            return new ResponseData<>(HttpStatus.CREATED.value(), "Node edge created successfully",
                    nodeEdgeService.createEdge(request));
        }

        @Operation(summary = "Get materials and tests for a specific node")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/learning-nodes/{nodeId}/content")
        public ResponseData<NodeContentResponse> getNodeContent(@PathVariable Long nodeId) {
            return new ResponseData<>(HttpStatus.OK.value(), "Node content retrieved successfully",
                    nodeContentService.getNodeContent(nodeId));
        }

        @Operation(summary = "Add learning material (video or file) to a node")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @ResponseStatus(HttpStatus.CREATED)
        @PostMapping(value = "/learning-nodes/{nodeId}/materials", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseData<NodeMaterialResponse> addMaterial(
                @PathVariable Long nodeId,
                @Valid @ModelAttribute CreateNodeMaterialRequest request,
                @RequestParam(value = "file", required = false) MultipartFile file) {
            return new ResponseData<>(HttpStatus.CREATED.value(), "Learning material added successfully",
                    nodeContentService.addMaterial(nodeId, request, file));
        }

        @Operation(summary = "Delete learning material from a node")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @DeleteMapping("/materials/{materialId}")
        public ResponseData<Void> deleteMaterial(@PathVariable Long materialId) {
            nodeContentService.deleteMaterial(materialId);
            return new ResponseData<>(HttpStatus.OK.value(), "Learning material deleted successfully");
        }

        @Operation(summary = "Add test to a learning node")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @ResponseStatus(HttpStatus.CREATED)
        @PostMapping("/learning-nodes/{nodeId}/tests")
        public ResponseData<NodeTestResponse> addTest(
                @PathVariable Long nodeId,
                @Valid @RequestBody CreateNodeTestRequest request) {
            return new ResponseData<>(HttpStatus.CREATED.value(), "Test added successfully",
                    nodeContentService.addTest(nodeId, request));
        }

        @Operation(summary = "Delete test from a learning node")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @DeleteMapping("/tests/{testId}")
        public ResponseData<Void> deleteTest(@PathVariable Long testId) {
            nodeContentService.deleteTest(testId);
            return new ResponseData<>(HttpStatus.OK.value(), "Test deleted successfully");
        }

        @Operation(summary = "Reorder materials and tests inside a learning node")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @PostMapping("/learning-nodes/{nodeId}/reorder-content")
        public ResponseData<Void> reorderContent(
                @PathVariable Long nodeId,
                @Valid @RequestBody List<ReorderContentRequest> requests) {
            nodeContentService.reorderContent(nodeId, requests);
            return new ResponseData<>(HttpStatus.OK.value(), "Content reordered successfully");
        }
}

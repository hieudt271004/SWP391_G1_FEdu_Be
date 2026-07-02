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

        @Operation(summary = "Clone a chosen template into the classroom-subject (single path)")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @ResponseStatus(HttpStatus.CREATED)
        @PostMapping("/classroom-subjects/{classroomSubjectId}/clone-learning-path")
        public ResponseData<LearningPathResponse> cloneLearningPath(@PathVariable Long classroomSubjectId,
                                                                    @RequestParam(required = false) Long templatePathId) {
            return new ResponseData<>(HttpStatus.CREATED.value(), "Learning path cloned successfully",
                    learningPathService.cloneLearningPath(classroomSubjectId, templatePathId));
        }

        @Operation(summary = "Get classroom learning paths")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/classroom-subjects/{classroomSubjectId}/learning-paths")
        public ResponseData<List<LearningPathResponse>> getClassroomLearningPaths(@PathVariable Long classroomSubjectId) {
            return new ResponseData<>(HttpStatus.OK.value(), "Classroom learning paths retrieved successfully",
                    learningPathService.getClassroomLearningPaths(classroomSubjectId));
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
        @GetMapping("/classroom-subjects/{classroomSubjectId}/learning-nodes")
        public ResponseData<List<LearningNodeResponse>> getClassroomNodesByClassroomId(@PathVariable Long classroomSubjectId) {
            return new ResponseData<>(HttpStatus.OK.value(), "Classroom nodes retrieved successfully",
                    learningPathService.getClassroomNodesByClassroomId(classroomSubjectId));
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
        @GetMapping("/classroom-subjects/{classroomSubjectId}/graph")
        public ResponseData<ClassroomGraphResponse> getClassroomGraph(@PathVariable Long classroomSubjectId) {
            return new ResponseData<>(HttpStatus.OK.value(), "Classroom graph retrieved successfully",
                    learningPathService.getClassroomGraph(classroomSubjectId));
        }

        @Operation(summary = "Publish classroom learning path")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @PostMapping("/classroom-subjects/{classroomSubjectId}/learning-paths/{pathId}/publish")
        public ResponseData<PublishResultResponse> publishClassroomPath(@PathVariable Long classroomSubjectId, @PathVariable Long pathId) {
            return new ResponseData<>(HttpStatus.OK.value(), "Lộ trình đã được publish thành công",
                    learningPathService.publishClassroomPath(classroomSubjectId, pathId));
        }

        @Operation(summary = "Unpublish classroom learning path")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @PostMapping("/classroom-subjects/{classroomSubjectId}/learning-paths/{pathId}/unpublish")
        public ResponseData<Void> unpublishClassroomPath(@PathVariable Long classroomSubjectId, @PathVariable Long pathId) {
            learningPathService.unpublishClassroomPath(classroomSubjectId, pathId);
            return new ResponseData<>(HttpStatus.OK.value(), "Lộ trình đã được unpublish thành công");
        }

        @Operation(summary = "Delete draft learning path")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @DeleteMapping("/classroom-subjects/{classroomSubjectId}/learning-paths/{pathId}")
        public ResponseData<Void> deleteDraftPath(@PathVariable Long classroomSubjectId, @PathVariable Long pathId) {
            learningPathService.deleteDraftPath(classroomSubjectId, pathId);
            return new ResponseData<>(HttpStatus.OK.value(), "Lộ trình nháp đã được xóa thành công");
        }


        @Operation(summary = "Update test details")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @PutMapping("/tests/{testId}")
        public ResponseData<NodeTestResponse> updateTest(
                @PathVariable Long testId,
                @Valid @RequestBody UpdateTestRequest request) {
            log.info("Teacher updating test ID: {}", testId);
            return new ResponseData<>(HttpStatus.OK.value(), "Test updated successfully",
                    nodeContentService.updateTest(testId, request));
        }

        @Operation(summary = "Get list of student attempts for a test")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/tests/{testId}/attempts")
        public ResponseData<List<StudentAttemptResponse>> getTestAttempts(@PathVariable Long testId) {
            log.info("Teacher fetching student attempts for test ID: {}", testId);
            return new ResponseData<>(HttpStatus.OK.value(), "Retrieved student attempts successfully",
                    nodeContentService.getTestAttempts(testId));
        }


        @Operation(summary = "Create node edge connection (prerequisite link between nodes)")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @ResponseStatus(HttpStatus.CREATED)
        @PostMapping("/node-edges")
        public ResponseData<NodeEdgeResponse> createNodeEdge(@Valid @RequestBody CreateNodeEdgeRequest request) {
            log.info("Teacher creating node edge from {} to {}", request.getFromNodeId(), request.getToNodeId());
            return new ResponseData<>(HttpStatus.CREATED.value(), "Node edge created successfully",
                    nodeEdgeService.createEdge(request));
        }
        @Operation(summary = "Delete node edge connection")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @DeleteMapping("/node-edges/{edgeId}")
        public ResponseData<Void> deleteNodeEdge(@PathVariable Long edgeId) {
            log.info("Teacher deleting node edge ID: {}", edgeId);
            nodeEdgeService.deleteEdge(edgeId);
            return new ResponseData<>(HttpStatus.OK.value(), "Node edge deleted successfully");
        }

        @Operation(summary = "Unlock an ON_CLASS node for the whole class")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @PostMapping("/classroom-subjects/{classroomSubjectId}/nodes/{nodeId}/unlock")
        public ResponseData<Integer> unlockOnClassNode(@PathVariable Long classroomSubjectId, @PathVariable Long nodeId) {
            int opened = learningPathService.unlockOnClassNode(classroomSubjectId, nodeId);
            return new ResponseData<>(HttpStatus.OK.value(),
                    "Đã mở khóa node trên lớp cho " + opened + " học sinh", opened);
        }

        @Operation(summary = "Get list of students assigned to a classroom learning node")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/learning-nodes/{nodeId}/students")
        public ResponseData<List<StudentInClassResponse>> getNodeStudents(@PathVariable Long nodeId) {
            log.info("Teacher requests list of students assigned to node ID: {}", nodeId);
            return new ResponseData<>(HttpStatus.OK.value(), "Retrieved node students successfully",
                    learningPathService.getNodeStudents(nodeId));
        }

        @Operation(summary = "Assign/unassign students to/from a classroom learning node")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @PutMapping("/learning-nodes/{nodeId}/students")
        public ResponseData<Void> assignStudentsToNode(
                @PathVariable Long nodeId,
                @RequestBody List<Long> studentUserIds) {
            log.info("Teacher assigning students to node ID: {}, students count: {}", nodeId, studentUserIds.size());
            learningPathService.assignStudentsToNode(nodeId, studentUserIds);
            return new ResponseData<>(HttpStatus.OK.value(), "Assigned students to node successfully");
        }
}

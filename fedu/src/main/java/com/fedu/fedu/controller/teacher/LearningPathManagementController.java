package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.req.*;
import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.service.LearningPathService;
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
@Tag(name = "Teacher Management Controller", description = "APIs for lecturer to manage classrooms and subjects")
public class LearningPathManagementController {

        private final LearningPathService learningPathService;

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
        @PostMapping("/classroom-subjects/{classroomSubjectId}/clone-learning-path/{templatePathId}")
        public ResponseData<LearningPathResponse> cloneLearningPath(@PathVariable Long classroomSubjectId, @PathVariable Long templatePathId) {
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

        @Operation(summary = "Unlock an ON_CLASS node for the whole class")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @PostMapping("/classroom-subjects/{classroomSubjectId}/nodes/{nodeId}/unlock")
        public ResponseData<Integer> unlockOnClassNode(@PathVariable Long classroomSubjectId, @PathVariable Long nodeId) {
            int opened = learningPathService.unlockOnClassNode(classroomSubjectId, nodeId);
            return new ResponseData<>(HttpStatus.OK.value(),
                    "Đã mở khóa node trên lớp cho " + opened + " học sinh", opened);
        }
}

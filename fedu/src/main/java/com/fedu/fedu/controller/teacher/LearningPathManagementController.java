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
        @PostMapping("/learning-paths")
        public ResponseData<LearningPathResponse> createLearningPath(@Valid @RequestBody CreateLearningPathRequest request) {
            try {
                return new ResponseData<>(HttpStatus.CREATED.value(), "Learning path created successfully", learningPathService.createLearningPath(request));
            } catch (Exception e) {
                log.error("Create learning path failed", e);
                return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage());
            }
        }

        @Operation(summary = "Update learning path")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @PutMapping("/learning-paths/{pathId}")
        public ResponseData<LearningPathResponse> updateLearningPath(@PathVariable Long pathId, @Valid @RequestBody UpdateLearningPathRequest request) {
            try {
                return new ResponseData<>(HttpStatus.OK.value(), "Learning path updated successfully", learningPathService.updateLearningPath(pathId, request));
            } catch (Exception e) {
                log.error("Update learning path failed", e);
                return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage());
            }
        }

        @Operation(summary = "Delete learning path")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @DeleteMapping("/learning-paths/{pathId}")
        public ResponseData<Void> deleteLearningPath(@PathVariable Long pathId) {
            try {
                learningPathService.deleteLearningPath(pathId);
                return new ResponseData<>(HttpStatus.OK.value(), "Learning path deleted successfully");
            } catch (Exception e) {
                log.error("Delete learning path failed", e);
                return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage());
            }
        }

        @Operation(summary = "Get learning path by id")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/learning-paths/{pathId}")
        public ResponseData<LearningPathResponse> getLearningPathById(@PathVariable Long pathId) {
            try {
                return new ResponseData<>(HttpStatus.OK.value(), "Learning path retrieved successfully", learningPathService.getLearningPathById(pathId));
            } catch (Exception e) {
                log.error("Get learning path failed", e);
                return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage());
            }
        }

        @Operation(summary = "Get learning paths by subject")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/subjects/{subjectId}/learning-paths")
        public ResponseData<List<LearningPathResponse>> getLearningPathsBySubjectId(@PathVariable Long subjectId) {
            try {
                return new ResponseData<>(HttpStatus.OK.value(), "Learning paths retrieved successfully", learningPathService.getLearningPathsBySubjectId(subjectId));
            } catch (Exception e) {
                log.error("Get learning paths failed", e);
                return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage());
            }
        }

        @Operation(summary = "Clone learning path to classroom")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @PostMapping("/classrooms/{classroomId}/clone-learning-path/{pathId}")
        public ResponseData<LearningPathResponse> cloneLearningPath(@PathVariable Long classroomId, @PathVariable Long pathId) {
            try {
                return new ResponseData<>(HttpStatus.CREATED.value(), "Learning path cloned successfully", learningPathService.cloneLearningPath(classroomId, pathId));
            } catch (Exception e) {
                log.error("Clone learning path failed", e);
                return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage());
            }
        }

        @Operation(summary = "Get classroom learning paths")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/classrooms/{classroomId}/learning-paths")
        public ResponseData<List<LearningPathResponse>> getClassroomLearningPaths(@PathVariable Long classroomId) {
            try {
                return new ResponseData<>(HttpStatus.OK.value(), "Classroom learning paths retrieved successfully", learningPathService.getClassroomLearningPaths(classroomId));
            } catch (Exception e) {
                log.error("Get classroom paths failed", e);
                return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage());
            }
        }

        @Operation(summary = "Create learning node")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @PostMapping("/learning-nodes")
        public ResponseData<LearningNodeResponse> createLearningNode(@Valid @RequestBody CreateLearningNodeRequest request) {
            try {
                return new ResponseData<>(HttpStatus.CREATED.value(), "Learning node created successfully", learningPathService.createLearningNode(request));
            } catch (Exception e) {
                log.error("Create learning node failed", e);
                return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage());
            }
        }

        @Operation(summary = "Update learning node")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @PutMapping("/learning-nodes/{nodeId}")
        public ResponseData<LearningNodeResponse> updateLearningNode(@PathVariable Long nodeId, @Valid @RequestBody UpdateLearningNodeRequest request) {
            try {
                return new ResponseData<>(HttpStatus.OK.value(), "Learning node updated successfully", learningPathService.updateLearningNode(nodeId, request));
            } catch (Exception e) {
                log.error("Update learning node failed", e);
                return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage());
            }
        }

        @Operation(summary = "Delete learning node")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @DeleteMapping("/learning-nodes/{nodeId}")
        public ResponseData<Void> deleteLearningNode(@PathVariable Long nodeId) {
            try {
                learningPathService.deleteLearningNode(nodeId);
                return new ResponseData<>(HttpStatus.OK.value(), "Learning node deleted successfully");
            } catch (Exception e) {
                log.error("Delete learning node failed", e);
                return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage());
            }
        }

        @Operation(summary = "Get learning node by id")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/learning-nodes/{nodeId}")
        public ResponseData<LearningNodeResponse> getLearningNodeById(@PathVariable Long nodeId) {
            try {
                return new ResponseData<>(HttpStatus.OK.value(), "Learning node retrieved successfully", learningPathService.getLearningNodeById(nodeId));
            } catch (Exception e) {
                log.error("Get learning node failed", e);
                return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage());
            }
        }

        @Operation(summary = "Get template nodes by path")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/learning-paths/{pathId}/nodes")
        public ResponseData<List<LearningNodeResponse>> getTemplateNodesByPathId(@PathVariable Long pathId) {
            try {
                return new ResponseData<>(HttpStatus.OK.value(), "Template nodes retrieved successfully", learningPathService.getTemplateNodesByPathId(pathId));
            } catch (Exception e) {
                log.error("Get template nodes failed", e);
                return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage());
            }
        }

        @Operation(summary = "Get classroom nodes by classroom")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/classrooms/{classroomId}/learning-nodes")
        public ResponseData<List<LearningNodeResponse>> getClassroomNodesByClassroomId(@PathVariable Long classroomId) {
            try {
                return new ResponseData<>(HttpStatus.OK.value(), "Classroom nodes retrieved successfully", learningPathService.getClassroomNodesByClassroomId(classroomId));
            } catch (Exception e) {
                log.error("Get classroom nodes failed", e);
                return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage());
            }
        }

        @Operation(summary = "Get learning path graph")
        @PreAuthorize("hasAuthority('ROLE_TEACHER')")
        @GetMapping("/learning-paths/{pathId}/graph")
        public ResponseData<LearningPathGraphResponse> getLearningPathGraph(@PathVariable Long pathId) {
            try {
                return new ResponseData<>(HttpStatus.OK.value(), "Learning path graph retrieved successfully", learningPathService.getLearningPathGraph(pathId));
            } catch (Exception e) {
                log.error("Get learning path graph failed", e);
                return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), e.getMessage());
            }
        }
}

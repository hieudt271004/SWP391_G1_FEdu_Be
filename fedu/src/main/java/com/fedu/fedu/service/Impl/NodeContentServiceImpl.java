package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.CreateNodeExerciseRequest;
import com.fedu.fedu.dto.req.CreateNodeMaterialRequest;
import com.fedu.fedu.dto.req.CreateNodeTestRequest;
import com.fedu.fedu.dto.req.ReorderContentRequest;
import com.fedu.fedu.dto.req.UpdateTestRequest;
import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.service.CloudinaryService;
import com.fedu.fedu.service.NodeContentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.math.BigDecimal;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NodeContentServiceImpl implements NodeContentService {

    private final LearningNodeRepository learningNodeRepository;
    private final NodeMaterialRepository nodeMaterialRepository;
    private final VideoRepository videoRepository;
    private final FileEntityRepository fileEntityRepository;
    private final TestRepository testRepository;
    private final StudentTestAttemptRepository studentTestAttemptRepository;
    private final NodeExerciseRepository nodeExerciseRepository;
    private final CloudinaryService cloudinaryService;
    private final TemplateEditGuard templateEditGuard;

    private static final String UPLOAD_DIR = "uploads";

    @Override
    @Transactional
    public NodeContentResponse getNodeContent(Long nodeId) {
        learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning node not found with id: " + nodeId));

        List<NodeMaterial> materials = nodeMaterialRepository.findByLearningNodeNodeIdAndIsDeletedFalse(nodeId);
        List<Test> tests = testRepository.findByLearningNodeNodeIdAndIsDeletedFalse(nodeId);
        List<NodeExercise> exercises = nodeExerciseRepository.findByLearningNodeNodeIdAndIsDeletedFalse(nodeId);

        // Khởi tạo order_index tuần tự nếu có item chưa có (thang dùng chung material/test/exercise)
        boolean hasNullIndex = materials.stream().anyMatch(m -> m.getOrderIndex() == null)
                || tests.stream().anyMatch(t -> t.getOrderIndex() == null)
                || exercises.stream().anyMatch(e -> e.getOrderIndex() == null);

        if (hasNullIndex) {
            int nextIndex = 1;
            for (NodeMaterial m : materials) {
                if (m.getOrderIndex() == null) {
                    m.setOrderIndex(nextIndex++);
                    nodeMaterialRepository.save(m);
                } else {
                    nextIndex = Math.max(nextIndex, m.getOrderIndex() + 1);
                }
            }
            for (Test t : tests) {
                if (t.getOrderIndex() == null) {
                    t.setOrderIndex(nextIndex++);
                    testRepository.save(t);
                } else {
                    nextIndex = Math.max(nextIndex, t.getOrderIndex() + 1);
                }
            }
            for (NodeExercise e : exercises) {
                if (e.getOrderIndex() == null) {
                    e.setOrderIndex(nextIndex++);
                    nodeExerciseRepository.save(e);
                } else {
                    nextIndex = Math.max(nextIndex, e.getOrderIndex() + 1);
                }
            }
        }

        return NodeContentResponse.builder()
                .materials(materials.stream().map(this::mapToMaterialResponse).collect(Collectors.toList()))
                .tests(tests.stream().map(this::mapToTestResponse).collect(Collectors.toList()))
                .exercises(exercises.stream().map(this::mapToExerciseResponse).collect(Collectors.toList()))
                .build();
    }

    @Override
    @Transactional
    public NodeMaterialResponse addMaterial(Long nodeId, CreateNodeMaterialRequest request, MultipartFile file) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning node not found with id: " + nodeId));
        templateEditGuard.assertNodeEditable(node);

        // Create NodeMaterial
        NodeMaterial material = NodeMaterial.builder()
                .learningNode(node)
                .title(request.getTitle())
                .required(request.getRequired() != null ? request.getRequired() : true)
                .orderIndex(getNextOrderIndex(nodeId))
                .isDeleted(false)
                .build();

        nodeMaterialRepository.save(material);

        // Handle physical file upload if provided
        if (file != null && !file.isEmpty()) {
            try {
                Path uploadPath = Paths.get(UPLOAD_DIR);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
                String cleanFileName = System.currentTimeMillis() + "_" + original.replaceAll("[^a-zA-Z0-9._-]", "_");
                Path filePath = uploadPath.resolve(cleanFileName);
                Files.write(filePath, file.getBytes());

                log.info("Saved file locally to: {}", filePath.toAbsolutePath());

                FileEntity fileEntity = FileEntity.builder()
                        .nodeMaterial(material)
                        .fileUrl("/uploads/" + cleanFileName)
                        .fileName(file.getOriginalFilename())
                        .fileType(file.getContentType())
                        .description(request.getFileDescription())
                        .isDeleted(false)
                        .build();

                fileEntityRepository.save(fileEntity);
                material.getFiles().add(fileEntity);

            } catch (IOException e) {
                log.error("Failed to upload file", e);
                throw new InvalidDataException("Could not store file. Error: " + e.getMessage());
            }
        } else if (request.getFileUrl() != null && !request.getFileUrl().trim().isEmpty()) {
            // Support external file URL links
            FileEntity fileEntity = FileEntity.builder()
                    .nodeMaterial(material)
                    .fileUrl(request.getFileUrl())
                    .fileName(request.getFileName() != null ? request.getFileName() : "Tài liệu học tập")
                    .fileType(request.getFileType() != null ? request.getFileType() : "Unknown")
                    .publicId(request.getPublicId())
                    .resourceType(request.getResourceType())
                    .description(request.getFileDescription())
                    .isDeleted(false)
                    .build();

            fileEntityRepository.save(fileEntity);
            material.getFiles().add(fileEntity);
        }

        // Handle video link if provided
        if (request.getVideoUrl() != null && !request.getVideoUrl().trim().isEmpty()) {
            Video video = Video.builder()
                    .nodeMaterial(material)
                    .videoUrl(request.getVideoUrl())
                    .title(request.getVideoTitle() != null ? request.getVideoTitle() : request.getTitle())
                    .durationSeconds(request.getVideoDuration())
                    .description(request.getVideoDescription())
                    .isDeleted(false)
                    .build();

            videoRepository.save(video);
            material.getVideos().add(video);
        }

        return mapToMaterialResponse(material);
    }

    @Override
    @Transactional
    public void deleteMaterial(Long materialId) {
        NodeMaterial material = nodeMaterialRepository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("Material not found with id: " + materialId));
        templateEditGuard.assertNodeEditable(material.getLearningNode());

        material.setIsDeleted(true);
        nodeMaterialRepository.save(material);

        // Soft-delete associated video components
        List<Video> videos = videoRepository.findByNodeMaterialMaterialIdAndIsDeletedFalse(materialId);
        for (Video v : videos) {
            v.setIsDeleted(true);
            videoRepository.save(v);
        }

        // Soft-delete associated file components + xóa asset thật trên Cloudinary
        List<FileEntity> files = fileEntityRepository.findByNodeMaterialMaterialIdAndIsDeletedFalse(materialId);
        for (FileEntity f : files) {
            // Chỉ xóa Cloudinary nếu file SỞ HỮU asset (publicId != null).
            // File clone dùng chung URL nhưng publicId null → không xóa nhầm asset gốc.
            if (f.getPublicId() != null && !f.getPublicId().isBlank()) {
                cloudinaryService.delete(f.getPublicId(), f.getResourceType());
            }
            f.setIsDeleted(true);
            fileEntityRepository.save(f);
        }
    }

    @Override
    @Transactional
    public NodeTestResponse addTest(Long nodeId, CreateNodeTestRequest request) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning node not found with id: " + nodeId));
        templateEditGuard.assertNodeEditable(node);

        Test test = Test.builder()
                .learningNode(node)
                .title(request.getTitle())
                .description(request.getDescription())
                .durationMinutes(request.getDurationMinutes())
                .passingPercentage(request.getPassingPercentage())
                .orderIndex(getNextOrderIndex(nodeId))
                .isDeleted(false)
                .build();

        testRepository.save(test);

        if (node.getTestKind() == com.fedu.fedu.utils.enums.NodeTestKind.PLACEMENT) {
            ClassroomSubject cs = node.getLearningPath().getClassroomSubject();
            if (cs != null) {
                cs.setQuizStart(test);
            }
        }

        return mapToTestResponse(test);
    }

    @Override
    @Transactional
    public void deleteTest(Long testId) {
        Test test = testRepository.findByTestIdAndIsDeletedFalse(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));
        templateEditGuard.assertNodeEditable(test.getLearningNode());

        test.setIsDeleted(true);
        testRepository.save(test);

        LearningNode node = test.getLearningNode();
        if (node != null && node.getTestKind() == com.fedu.fedu.utils.enums.NodeTestKind.PLACEMENT) {
            ClassroomSubject cs = node.getLearningPath().getClassroomSubject();
            if (cs != null && cs.getQuizStart() != null && cs.getQuizStart().getTestId().equals(testId)) {
                cs.setQuizStart(null);
            }
        }
    }

    @Override
    @Transactional
    public NodeExerciseResponse addExercise(Long nodeId, CreateNodeExerciseRequest request) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning node not found with id: " + nodeId));
        templateEditGuard.assertNodeEditable(node);

        NodeExercise exercise = NodeExercise.builder()
                .learningNode(node)
                .title(request.getTitle())
                .instructions(request.getInstructions())
                .allowText(request.getAllowText() != null ? request.getAllowText() : true)
                .allowFile(request.getAllowFile() != null ? request.getAllowFile() : true)
                .orderIndex(getNextOrderIndex(nodeId))
                .isDeleted(false)
                .build();

        nodeExerciseRepository.save(exercise);
        return mapToExerciseResponse(exercise);
    }

    @Override
    @Transactional
    public void deleteExercise(Long exerciseId) {
        NodeExercise exercise = nodeExerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found with id: " + exerciseId));
        templateEditGuard.assertNodeEditable(exercise.getLearningNode());
        exercise.setIsDeleted(true);
        nodeExerciseRepository.save(exercise);
    }

    // Mapping Helpers
    private NodeMaterialResponse mapToMaterialResponse(NodeMaterial m) {
        VideoResponse videoRes = null;
        List<Video> videos = videoRepository.findByNodeMaterialMaterialIdAndIsDeletedFalse(m.getMaterialId());
        if (!videos.isEmpty()) {
            Video v = videos.get(0);
            videoRes = VideoResponse.builder()
                    .videoId(v.getVideoId())
                    .videoUrl(v.getVideoUrl())
                    .title(v.getTitle())
                    .durationSeconds(v.getDurationSeconds())
                    .description(v.getDescription())
                    .build();
        }

        FileResponse fileRes = null;
        List<FileEntity> files = fileEntityRepository.findByNodeMaterialMaterialIdAndIsDeletedFalse(m.getMaterialId());
        if (!files.isEmpty()) {
            FileEntity f = files.get(0);
            fileRes = FileResponse.builder()
                    .fileId(f.getFileId())
                    .fileUrl(f.getFileUrl())
                    .fileName(f.getFileName())
                    .fileType(f.getFileType())
                    .description(f.getDescription())
                    .build();
        }

        return NodeMaterialResponse.builder()
                .materialId(m.getMaterialId())
                .title(m.getTitle())
                .required(m.getRequired())
                .orderIndex(m.getOrderIndex())
                .video(videoRes)
                .file(fileRes)
                .build();
    }

    private NodeTestResponse mapToTestResponse(Test t) {
        return NodeTestResponse.builder()
                .testId(t.getTestId())
                .title(t.getTitle())
                .description(t.getDescription())
                .durationMinutes(t.getDurationMinutes())
                .passingPercentage(t.getPassingPercentage())
                .orderIndex(t.getOrderIndex())
                .build();
    }

    private NodeExerciseResponse mapToExerciseResponse(NodeExercise e) {
        return NodeExerciseResponse.builder()
                .exerciseId(e.getExerciseId())
                .title(e.getTitle())
                .instructions(e.getInstructions())
                .allowText(e.getAllowText())
                .allowFile(e.getAllowFile())
                .orderIndex(e.getOrderIndex())
                .build();
    }

    @Override
    @Transactional
    public void reorderContent(Long nodeId, List<ReorderContentRequest> requests) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning node not found with id: " + nodeId));
        templateEditGuard.assertNodeEditable(node);

        for (ReorderContentRequest req : requests) {
            if ("MATERIAL".equalsIgnoreCase(req.getType())) {
                NodeMaterial material = nodeMaterialRepository.findById(req.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Material not found with id: " + req.getId()));
                material.setOrderIndex(req.getOrderIndex());
                nodeMaterialRepository.save(material);
            } else if ("TEST".equalsIgnoreCase(req.getType())) {
                Test test = testRepository.findByTestIdAndIsDeletedFalse(req.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + req.getId()));
                test.setOrderIndex(req.getOrderIndex());
                testRepository.save(test);
            } else if ("EXERCISE".equalsIgnoreCase(req.getType())) {
                NodeExercise exercise = nodeExerciseRepository.findById(req.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Exercise not found with id: " + req.getId()));
                exercise.setOrderIndex(req.getOrderIndex());
                nodeExerciseRepository.save(exercise);
            }
        }
    }

    private int getNextOrderIndex(Long nodeId) {
        List<NodeMaterial> materials = nodeMaterialRepository.findByLearningNodeNodeIdAndIsDeletedFalse(nodeId);
        List<Test> tests = testRepository.findByLearningNodeNodeIdAndIsDeletedFalse(nodeId);
        List<NodeExercise> exercises = nodeExerciseRepository.findByLearningNodeNodeIdAndIsDeletedFalse(nodeId);

        int max = 0;
        for (NodeMaterial m : materials) {
            if (m.getOrderIndex() != null && m.getOrderIndex() > max) {
                max = m.getOrderIndex();
            }
        }
        for (Test t : tests) {
            if (t.getOrderIndex() != null && t.getOrderIndex() > max) {
                max = t.getOrderIndex();
            }
        }
        for (NodeExercise e : exercises) {
            if (e.getOrderIndex() != null && e.getOrderIndex() > max) {
                max = e.getOrderIndex();
            }
        }
        return max + 1;
    }

    @Override
    @Transactional
    public NodeTestResponse updateTest(Long testId, UpdateTestRequest request) {
        Test test = testRepository.findByTestIdAndIsDeletedFalse(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));
        templateEditGuard.assertNodeEditable(test.getLearningNode());

        test.setTitle(request.getTitle());
        test.setDescription(request.getDescription());
        test.setDurationMinutes(request.getDurationMinutes());
        if (request.getPassingPercentage() != null) {
            test.setPassingPercentage(request.getPassingPercentage());
        }

        testRepository.save(test);
        return mapToTestResponse(test);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentAttemptResponse> getTestAttempts(Long testId) {
        Test test = testRepository.findByTestIdAndIsDeletedFalse(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));

        List<StudentTestAttempt> attempts = studentTestAttemptRepository.findByTestTestId(testId);
        BigDecimal passingPercentage = test.getPassingPercentage() != null ? test.getPassingPercentage() : BigDecimal.ZERO;

        return attempts.stream()
                .map(attempt -> {
                    String studentName = "";
                    String studentEmail = "";
                    if (attempt.getStudent() != null) {
                        studentEmail = attempt.getStudent().getEmail();
                        String firstName = attempt.getStudent().getFirstName() != null ? attempt.getStudent().getFirstName() : "";
                        String lastName = attempt.getStudent().getLastName() != null ? attempt.getStudent().getLastName() : "";
                        studentName = (firstName + " " + lastName).trim();
                    }

                    Boolean passed = null;
                    if (attempt.getScore() != null) {
                        passed = attempt.getScore().compareTo(passingPercentage) >= 0;
                    }

                    return StudentAttemptResponse.builder()
                            .attemptId(attempt.getAttemptId())
                            .studentId(attempt.getStudent() != null ? attempt.getStudent().getUserId() : null)
                            .studentName(studentName)
                            .studentEmail(studentEmail)
                            .score(attempt.getScore())
                            .passed(passed)
                            .startedAt(attempt.getStartedAt())
                            .submittedAt(attempt.getSubmittedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }
}

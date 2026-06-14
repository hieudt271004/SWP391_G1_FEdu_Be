package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.CreateNodeMaterialRequest;
import com.fedu.fedu.dto.req.CreateNodeTestRequest;
import com.fedu.fedu.dto.req.ReorderContentRequest;
import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.service.NodeContentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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

    private static final String UPLOAD_DIR = "uploads";

    @Override
    @Transactional
    public NodeContentResponse getNodeContent(Long nodeId) {
        learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning node not found with id: " + nodeId));

        List<NodeMaterial> materials = nodeMaterialRepository.findByLearningNodeNodeIdAndIsDeletedFalse(nodeId);
        List<Test> tests = testRepository.findByLearningNodeNodeIdAndIsDeletedFalse(nodeId);

        // Check if any orderIndex is null and initialize them sequentially
        boolean hasNullIndex = false;
        for (NodeMaterial m : materials) {
            if (m.getOrderIndex() == null) {
                hasNullIndex = true;
                break;
            }
        }
        if (!hasNullIndex) {
            for (Test t : tests) {
                if (t.getOrderIndex() == null) {
                    hasNullIndex = true;
                    break;
                }
            }
        }

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
        }

        List<NodeMaterialResponse> materialResponses = materials.stream()
                .map(this::mapToMaterialResponse)
                .collect(Collectors.toList());

        List<NodeTestResponse> testResponses = tests.stream()
                .map(this::mapToTestResponse)
                .collect(Collectors.toList());

        return NodeContentResponse.builder()
                .materials(materialResponses)
                .tests(testResponses)
                .build();
    }

    @Override
    @Transactional
    public NodeMaterialResponse addMaterial(Long nodeId, CreateNodeMaterialRequest request, MultipartFile file) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning node not found with id: " + nodeId));

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

        material.setIsDeleted(true);
        nodeMaterialRepository.save(material);

        // Soft-delete associated video components
        List<Video> videos = videoRepository.findByNodeMaterialMaterialIdAndIsDeletedFalse(materialId);
        for (Video v : videos) {
            v.setIsDeleted(true);
            videoRepository.save(v);
        }

        // Soft-delete associated file components
        List<FileEntity> files = fileEntityRepository.findByNodeMaterialMaterialIdAndIsDeletedFalse(materialId);
        for (FileEntity f : files) {
            f.setIsDeleted(true);
            fileEntityRepository.save(f);
        }
    }

    @Override
    @Transactional
    public NodeTestResponse addTest(Long nodeId, CreateNodeTestRequest request) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning node not found with id: " + nodeId));

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
        return mapToTestResponse(test);
    }

    @Override
    @Transactional
    public void deleteTest(Long testId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));

        test.setIsDeleted(true);
        testRepository.save(test);
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

    @Override
    @Transactional
    public void reorderContent(Long nodeId, List<ReorderContentRequest> requests) {
        learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning node not found with id: " + nodeId));

        for (ReorderContentRequest req : requests) {
            if ("MATERIAL".equalsIgnoreCase(req.getType())) {
                NodeMaterial material = nodeMaterialRepository.findById(req.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Material not found with id: " + req.getId()));
                material.setOrderIndex(req.getOrderIndex());
                nodeMaterialRepository.save(material);
            } else if ("TEST".equalsIgnoreCase(req.getType())) {
                Test test = testRepository.findById(req.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + req.getId()));
                test.setOrderIndex(req.getOrderIndex());
                testRepository.save(test);
            }
        }
    }

    private int getNextOrderIndex(Long nodeId) {
        List<NodeMaterial> materials = nodeMaterialRepository.findByLearningNodeNodeIdAndIsDeletedFalse(nodeId);
        List<Test> tests = testRepository.findByLearningNodeNodeIdAndIsDeletedFalse(nodeId);

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
        return max + 1;
    }
}

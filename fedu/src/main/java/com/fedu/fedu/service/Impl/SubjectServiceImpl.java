package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.SubjectRequest;
import com.fedu.fedu.dto.res.SubjectResponse;
import com.fedu.fedu.entity.LearningPath;
import com.fedu.fedu.entity.Subject;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.LearningPathRepository;
import com.fedu.fedu.repository.SubjectRepository;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.service.SubjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fedu.fedu.repository.LearningNodeRepository;
import com.fedu.fedu.entity.LearningNode;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;
    private final UserAccountRepository userAccountRepository;
    private final LearningPathRepository learningPathRepository;
    private final LearningNodeRepository learningNodeRepository;

    @Override
    @Transactional
    public SubjectResponse createSubject(SubjectRequest request, long createdByUserId) {
        log.info("Creating subject: {}", request.getSubjectCode());

        if (subjectRepository.existsBySubjectCode(request.getSubjectCode())) {
            throw new InvalidDataException("Subject code '" + request.getSubjectCode() + "' already exists");
        }

        UserAccount creator = userAccountRepository.findById(createdByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + createdByUserId));

        Subject subject = Subject.builder()
                .subjectCode(request.getSubjectCode().trim().toUpperCase())
                .subjectName(request.getSubjectName().trim())
                .description(request.getDescription())
                .learningpathLength(request.getLearningpathLength())
                .createdBy(creator)
                .isDeleted(false)
                .status("draft")
                .build();

        Subject saved = subjectRepository.save(subject);

        LearningPath lp = LearningPath.builder()
                .subject(saved)
                .pathName("Lộ trình mẫu")
                .description("Lộ trình mẫu mặc định cho môn " + saved.getSubjectCode())
                .isDeleted(false)
                .createdBy(creator)
                .build();
        learningPathRepository.save(lp);

        return SubjectResponse.from(saved);
    }

    @Override
    @Transactional
    public SubjectResponse updateSubject(Long subjectId, SubjectRequest request) {
        log.info("Updating subject id: {}", subjectId);

        Subject subject = subjectRepository.findBySubjectIdAndIsDeletedFalse(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + subjectId));

        if (!subject.getSubjectCode().equalsIgnoreCase(request.getSubjectCode())
                && subjectRepository.existsBySubjectCode(request.getSubjectCode())) {
            throw new InvalidDataException("Subject code '" + request.getSubjectCode() + "' already exists");
        }

        subject.setSubjectCode(request.getSubjectCode().trim().toUpperCase());
        subject.setSubjectName(request.getSubjectName().trim());
        subject.setDescription(request.getDescription());
        subject.setLearningpathLength(request.getLearningpathLength());
        // status chỉ đổi qua publish/unpublish (có guard kiểm tra lộ trình), không sửa ở đây

        return SubjectResponse.from(subjectRepository.save(subject));
    }

    @Override
    @Transactional
    public SubjectResponse publishSubject(Long subjectId) {
        log.info("Publishing subject id: {}", subjectId);

        Subject subject = subjectRepository.findBySubjectIdAndIsDeletedFalse(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + subjectId));

        java.util.List<com.fedu.fedu.entity.LearningPath> paths = learningPathRepository
                .findBySubjectSubjectIdAndClassroomSubjectIsNullAndIsDeletedFalse(subjectId);
        if (paths.isEmpty()) {
            throw new InvalidDataException("Môn học chưa có lộ trình mẫu nào — không thể xuất bản.");
        }

        if (subject.getLearningpathLength() == null || subject.getLearningpathLength() <= 0) {
            throw new InvalidDataException("Môn học chưa cấu hình số chặng (learningpathLength) hợp lệ.");
        }

        for (com.fedu.fedu.entity.LearningPath path : paths) {
            List<LearningNode> nodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(path.getPathId());
            long stageCount = nodes.stream()
                    .map(LearningNode::getStageOrder)
                    .filter(java.util.Objects::nonNull)
                    .distinct().count();
            long effective = stageCount > 0 ? stageCount : nodes.size();
            if (effective != subject.getLearningpathLength()) {
                throw new InvalidDataException(
                        String.format("Lộ trình '%s' có %d chặng, chưa đúng với số chặng yêu cầu của môn học (%d).",
                                path.getPathName(), effective, subject.getLearningpathLength())
                );
            }
        }

        subject.setStatus("published");
        return SubjectResponse.from(subjectRepository.save(subject));
    }

    @Override
    @Transactional
    public SubjectResponse unpublishSubject(Long subjectId) {
        log.info("Unpublishing subject id: {}", subjectId);

        Subject subject = subjectRepository.findBySubjectIdAndIsDeletedFalse(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + subjectId));

        subject.setStatus("draft");
        return SubjectResponse.from(subjectRepository.save(subject));
    }

    @Override
    @Transactional
    public void deleteSubject(Long subjectId) {
        log.info("Soft-deleting subject id: {}", subjectId);

        Subject subject = subjectRepository.findBySubjectIdAndIsDeletedFalse(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + subjectId));

        subject.setIsDeleted(true);
        subjectRepository.save(subject);
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectResponse getSubjectById(Long subjectId) {
        Subject subject = subjectRepository.findBySubjectIdAndIsDeletedFalse(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + subjectId));
        return SubjectResponse.from(subject);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectResponse> getAllSubjects() {
        return subjectRepository.findAllActive().stream()
                .map(SubjectResponse::from).toList();
    }

    @Override @Transactional(readOnly = true)
    public List<SubjectResponse> getSubjectsByTeacher(long teacherId) {
        return subjectRepository.findAllByTeacher(teacherId).stream()
                .map(SubjectResponse::from).toList();
    }
}

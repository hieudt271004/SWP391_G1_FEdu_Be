package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.SubjectRequest;
import com.fedu.fedu.dto.res.SubjectResponse;
import com.fedu.fedu.entity.Subject;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.SubjectRepository;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.service.SubjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;
    private final UserAccountRepository userAccountRepository;

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
                .createdBy(creator)
                .isDeleted(false)
                .status(request.getStatus() != null ? request.getStatus().trim() : "draft")
                .build();

        Subject saved = subjectRepository.save(subject);
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
        if (request.getStatus() != null) {
            subject.setStatus(request.getStatus().trim());
        }

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

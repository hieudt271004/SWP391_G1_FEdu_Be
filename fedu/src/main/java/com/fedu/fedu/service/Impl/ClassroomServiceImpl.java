package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.ClassroomRequest;
import com.fedu.fedu.dto.res.ClassroomResponse;
import com.fedu.fedu.dto.res.SubjectResponse;
import com.fedu.fedu.entity.Classroom;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomRepository;
import com.fedu.fedu.repository.ClassroomSubjectRepository;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.service.ClassroomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClassroomServiceImpl implements ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final ClassroomSubjectRepository classroomSubjectRepository;

    @Override
    @Transactional
    public ClassroomResponse createClassroom(ClassroomRequest request) {
        log.info("Creating classroom '{}'", request.getClassName());

        Classroom classroom = Classroom.builder()
                .className(request.getClassName().trim())
                .semester(request.getSemester())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : "inactive")
                .isDeleted(false)
                .build();

        Classroom saved = classroomRepository.save(classroom);
        log.info("Classroom created with id: {}", saved.getClassroomId());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ClassroomResponse updateClassroom(Long classroomId, ClassroomRequest request) {
        log.info("Updating classroom id: {}", classroomId);

        Classroom classroom = classroomRepository.findByClassroomIdAndIsDeletedFalse(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found with id: " + classroomId));

        classroom.setClassName(request.getClassName().trim());
        classroom.setSemester(request.getSemester());
        classroom.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            classroom.setStatus(request.getStatus());
        }

        Classroom updated = classroomRepository.save(classroom);
        return toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteClassroom(Long classroomId) {
        log.info("Soft-deleting classroom id: {}", classroomId);

        Classroom classroom = classroomRepository.findByClassroomIdAndIsDeletedFalse(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found with id: " + classroomId));

        classroom.setIsDeleted(true);
        classroomRepository.save(classroom);
    }

    @Override
    @Transactional(readOnly = true)
    public ClassroomResponse getClassroomById(Long classroomId) {
        Classroom classroom = classroomRepository.findByClassroomIdAndIsDeletedFalse(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found with id: " + classroomId));
        return toResponse(classroom);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomResponse> getAllClassrooms() {
        return classroomRepository.findAllActive()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomResponse> getClassroomsBySubject(Long subjectId) {
        return classroomSubjectRepository.findBySubjectSubjectId(subjectId)
                .stream()
                .map(cs -> toResponse(cs.getClassroom()))
                .collect(Collectors.toList());
    }

    @Override
    public List<ClassroomResponse> getClassroomsByLecturerId(Long lecturerId) {
        return classroomSubjectRepository.findByLecturerId(lecturerId)
                .stream()
                .map(cs -> toResponse(cs.getClassroom()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomResponse> getClassroomsByStudent(long studentId) {
        return classroomSubjectStudentRepository.findAllByStudentId(studentId)
                .stream()
                .map(cs -> toResponse(cs.getClassroomSubject().getClassroom()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomResponse> getClassroomsByTeacher(long teacherId) {
        return classroomSubjectRepository.findByLecturerId(teacherId)
                .stream()
                .map(cs -> toResponse(cs.getClassroom()))
                .collect(Collectors.toList());
    }

    public List<SubjectResponse> getSubjectsByLecturerId(Long lecturerId) {
        return classroomSubjectRepository.findByLecturerId(lecturerId)
                .stream()
                .map(cs -> SubjectResponse.from(cs.getSubject()))
                .distinct()
                .collect(Collectors.toList());
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────

    private ClassroomResponse toResponse(Classroom classroom) {
        int subjectCount = classroomSubjectRepository
                .findByClassroomClassroomId(classroom.getClassroomId()).size();
        int studentCount = classroomSubjectStudentRepository
                .findAllByClassroomId(classroom.getClassroomId()).size();

        return ClassroomResponse.builder()
                .classroomId(classroom.getClassroomId())
                .className(classroom.getClassName())
                .semester(classroom.getSemester())
                .description(classroom.getDescription())
                .status(classroom.getStatus())
                .subjectCount(subjectCount)
                .studentCount(studentCount)
                .createdAt(classroom.getCreatedAt())
                .updatedAt(classroom.getUpdatedAt())
                .build();
    }
}

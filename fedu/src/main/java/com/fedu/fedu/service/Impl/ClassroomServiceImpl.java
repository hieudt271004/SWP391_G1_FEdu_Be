package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AssignTeacherRequest;
import com.fedu.fedu.dto.req.ClassroomRequest;
import com.fedu.fedu.dto.res.ClassroomResponse;
import com.fedu.fedu.entity.Classroom;
import com.fedu.fedu.entity.Subject;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomRepository;
import com.fedu.fedu.repository.ClassroomStudentRepository;
import com.fedu.fedu.repository.SubjectRepository;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.dto.res.ClassroomResponse;
import com.fedu.fedu.dto.res.SubjectResponse;
import com.fedu.fedu.entity.Classroom;
import com.fedu.fedu.repository.ClassroomRepository;
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
    private final ClassroomStudentRepository classroomStudentRepository;
    private final SubjectRepository subjectRepository;
    private final UserAccountRepository userAccountRepository;

    @Override
    @Transactional
    public ClassroomResponse createClassroom(ClassroomRequest request, long currentUserId) {
        log.info("Creating classroom '{}' for subject id: {}", request.getClassName(), request.getSubjectId());

        Subject subject = subjectRepository.findBySubjectIdAndIsDeletedFalse(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + request.getSubjectId()));

        // TEACHER: lecturerId = themselves; ADMIN: can assign a different lecturerId
        long resolvedLecturerId = (request.getLecturerId() != null) ? request.getLecturerId() : currentUserId;
        UserAccount lecturer = userAccountRepository.findById(resolvedLecturerId)
                .orElseThrow(() -> new ResourceNotFoundException("Lecturer not found with id: " + resolvedLecturerId));

        Classroom classroom = Classroom.builder()
                .subject(subject)
                .className(request.getClassName().trim())
                .semester(request.getSemester())
                .description(request.getDescription())
                .lecturer(lecturer)
                .isDeleted(false)
                .build();

        Classroom saved = classroomRepository.save(classroom);
        log.info("Classroom created with id: {}", saved.getClassroomId());
        return toResponse(saved);
    }

    // ─── UPDATE ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public ClassroomResponse updateClassroom(Long classroomId, ClassroomRequest request) {
        log.info("Updating classroom id: {}", classroomId);

        Classroom classroom = classroomRepository.findByClassroomIdAndIsDeletedFalse(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found with id: " + classroomId));

        // Update subject if it has changed
        if (!classroom.getSubject().getSubjectId().equals(request.getSubjectId())) {
            Subject newSubject = subjectRepository.findBySubjectIdAndIsDeletedFalse(request.getSubjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + request.getSubjectId()));
            classroom.setSubject(newSubject);
        }

        // Update lecturer if provided
        if (request.getLecturerId() != null && classroom.getLecturer().getUserId() != request.getLecturerId()) {
            UserAccount newLecturer = userAccountRepository.findById(request.getLecturerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lecturer not found with id: " + request.getLecturerId()));
            classroom.setLecturer(newLecturer);
        }

        classroom.setClassName(request.getClassName().trim());
        classroom.setSemester(request.getSemester());
        classroom.setDescription(request.getDescription());

        Classroom updated = classroomRepository.save(classroom);
        return toResponse(updated);
    }

    // ─── DELETE ──────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void deleteClassroom(Long classroomId) {
        log.info("Soft-deleting classroom id: {}", classroomId);

        Classroom classroom = classroomRepository.findByClassroomIdAndIsDeletedFalse(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found with id: " + classroomId));

        classroom.setIsDeleted(true);
        classroomRepository.save(classroom);
    }

    // ─── READ ────────────────────────────────────────────────────────────────

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
        return classroomRepository.findAllBySubject(subjectId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ClassroomResponse> getClassroomsByLecturerId(Long lecturerId) {
        List<Classroom> classrooms = classroomRepository.findByLecturer_UserIdAndIsDeletedFalse(lecturerId);
        return classrooms.stream()
                .map(this::mapToClassroomResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomResponse> getClassroomsByTeacher(long teacherId) {
        return classroomRepository.findAllByLecturer(teacherId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─── ASSIGN TEACHER ──────────────────────────────────────────────────────

    @Override
    @Transactional
    public ClassroomResponse assignTeacher(Long classroomId, AssignTeacherRequest request) {
        log.info("Assigning teacher id: {} to classroom id: {}", request.getTeacherId(), classroomId);

        Classroom classroom = classroomRepository.findByClassroomIdAndIsDeletedFalse(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found with id: " + classroomId));

        UserAccount teacher = userAccountRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new ResourceNotFoundException("Lecturer not found with id: " + request.getTeacherId()));

        classroom.setLecturer(teacher);
        Classroom updated = classroomRepository.save(classroom);
        return toResponse(updated);
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────

    private ClassroomResponse toResponse(Classroom classroom) {
        UserAccount lecturer = classroom.getLecturer();
        Subject subject = classroom.getSubject();
        int studentCount = classroomStudentRepository.findAllByClassroomId(classroom.getClassroomId()).size();

        return ClassroomResponse.builder()
                .classroomId(classroom.getClassroomId())
                .className(classroom.getClassName())
                .semester(classroom.getSemester())
                .description(classroom.getDescription())
                .subjectId(classroom.getSubject().getSubjectId())
                .subjectCode(classroom.getSubject().getSubjectCode())
                .subjectName(classroom.getSubject().getSubjectName())
                .lecturerId(classroom.getLecturer().getUserId())
                .lecturerEmail(classroom.getLecturer().getEmail())
                .lecturerName(lecturer.getFirstName() + " " + lecturer.getLastName())
                .studentCount(studentCount)
                .build();
    }

    public List<SubjectResponse> getSubjectsByLecturerId(Long lecturerId) {
        List<Classroom> classrooms = classroomRepository.findByLecturer_UserIdAndIsDeletedFalse(lecturerId);
        return classrooms.stream()
                .map(Classroom::getSubject)
                .distinct()
                .map(subject -> SubjectResponse.builder()
                        .subjectId(subject.getSubjectId())
                        .subjectCode(subject.getSubjectCode())
                        .subjectName(subject.getSubjectName())
                        .description(subject.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    private ClassroomResponse mapToClassroomResponse(Classroom classroom) {
        return ClassroomResponse.builder()
                .classroomId(classroom.getClassroomId())
                .className(classroom.getClassName())
                .semester(classroom.getSemester())
                .description(classroom.getDescription())
                .createdAt(classroom.getCreatedAt())
                .updatedAt(classroom.getUpdatedAt())
                .build();
    }
}

package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AssignTeacherRequest;
import com.fedu.fedu.dto.req.ClassroomRequest;
import com.fedu.fedu.dto.res.ClassroomResponse;
import com.fedu.fedu.dto.res.SubjectResponse;
import com.fedu.fedu.entity.Classroom;
import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.entity.Subject;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomRepository;
import com.fedu.fedu.repository.ClassroomSubjectRepository;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.repository.SubjectRepository;
import com.fedu.fedu.repository.UserAccountRepository;
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
                .className(request.getClassName().trim())
                .semester(request.getSemester())
                .description(request.getDescription())
                .isDeleted(false)
                .build();
        Classroom saved = classroomRepository.save(classroom);

        // Tạo bản ghi ClassroomSubject để liên kết lớp - môn học - giảng viên
        ClassroomSubject classroomSubject = ClassroomSubject.builder()
                .classroom(saved)
                .subject(subject)
                .lecturer(lecturer)
                .build();
        classroomSubjectRepository.save(classroomSubject);

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

        // Cập nhật subject và lecturer trong ClassroomSubject nếu cần
        if (request.getSubjectId() != null) {
            Subject newSubject = subjectRepository.findBySubjectIdAndIsDeletedFalse(request.getSubjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + request.getSubjectId()));

            ClassroomSubject cs = classroomSubjectRepository
                    .findByClassroomClassroomId(classroomId)
                    .stream().findFirst().orElse(ClassroomSubject.builder().classroom(classroom).build());

            cs.setSubject(newSubject);

            if (request.getLecturerId() != null) {
                UserAccount newLecturer = userAccountRepository.findById(request.getLecturerId())
                        .orElseThrow(() -> new ResourceNotFoundException("Lecturer not found with id: " + request.getLecturerId()));
                cs.setLecturer(newLecturer);
            }
            classroomSubjectRepository.save(cs);
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

    @Override
    @Transactional
    public ClassroomResponse assignTeacher(Long classroomId, AssignTeacherRequest request) {
        log.info("Assigning teacher id: {} to classroom id: {}", request.getTeacherId(), classroomId);

        Classroom classroom = classroomRepository.findByClassroomIdAndIsDeletedFalse(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found with id: " + classroomId));

        UserAccount teacher = userAccountRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new ResourceNotFoundException("Lecturer not found with id: " + request.getTeacherId()));

        // Cập nhật lecturer trong bản ghi ClassroomSubject đầu tiên tìm được
        List<ClassroomSubject> csList = classroomSubjectRepository.findByClassroomClassroomId(classroomId);
        if (!csList.isEmpty()) {
            ClassroomSubject cs = csList.get(0);
            cs.setLecturer(teacher);
            classroomSubjectRepository.save(cs);
        }

        return toResponse(classroom);
    }

    public List<SubjectResponse> getSubjectsByLecturerId(Long lecturerId) {
        return classroomSubjectRepository.findByLecturerId(lecturerId)
                .stream()
                .map(cs -> SubjectResponse.builder()
                        .subjectId(cs.getSubject().getSubjectId())
                        .subjectCode(cs.getSubject().getSubjectCode())
                        .subjectName(cs.getSubject().getSubjectName())
                        .description(cs.getSubject().getDescription())
                        .build())
                .distinct()
                .collect(Collectors.toList());
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────

    private ClassroomResponse toResponse(Classroom classroom) {
        int studentCount = classroomSubjectStudentRepository.findAllByClassroomId(classroom.getClassroomId()).size();

        // Lấy thông tin subject và lecturer từ ClassroomSubject
        List<ClassroomSubject> csList = classroomSubjectRepository.findByClassroomClassroomId(classroom.getClassroomId());
        
        ClassroomResponse.ClassroomResponseBuilder builder = ClassroomResponse.builder()
                .classroomId(classroom.getClassroomId())
                .className(classroom.getClassName())
                .semester(classroom.getSemester())
                .description(classroom.getDescription())
                .studentCount(studentCount)
                .createdAt(classroom.getCreatedAt())
                .updatedAt(classroom.getUpdatedAt());

        if (!csList.isEmpty()) {
            ClassroomSubject cs = csList.get(0);
            builder.subjectId(cs.getSubject().getSubjectId())
                    .subjectCode(cs.getSubject().getSubjectCode())
                    .subjectName(cs.getSubject().getSubjectName())
                    .lecturerId(cs.getLecturer().getUserId())
                    .lecturerEmail(cs.getLecturer().getEmail())
                    .lecturerName(cs.getLecturer().getFirstName() + " " + cs.getLecturer().getLastName())
                    .lecturerFirstName(cs.getLecturer().getFirstName())
                    .lecturerLastName(cs.getLecturer().getLastName());
        }

        return builder.build();
    }
}

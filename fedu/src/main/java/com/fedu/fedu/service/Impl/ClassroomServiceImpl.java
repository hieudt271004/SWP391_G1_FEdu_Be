package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.ClassroomRequest;
import com.fedu.fedu.dto.res.ClassroomResponse;
import com.fedu.fedu.dto.res.ClassroomSubjectResponse;
import com.fedu.fedu.dto.res.SubjectResponse;
import com.fedu.fedu.entity.Classroom;
import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomRepository;
import com.fedu.fedu.repository.ClassroomSubjectRepository;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.ClassroomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClassroomServiceImpl implements ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final ClassroomSubjectRepository classroomSubjectRepository;
    private final UserAccountRepository userAccountRepository;

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
        assertTeacherOwnsClassroom(classroomId);
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found with id: " + classroomId));

        classroom.setClassName(request.getClassName().trim());
        classroom.setSemester(request.getSemester());
        classroom.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            classroom.setStatus(request.getStatus());
        }

        return toResponse(classroomRepository.save(classroom));
    }

    @Override
    @Transactional
    public void deleteClassroom(Long classroomId) {
        log.info("Deleting classroom id: {}", classroomId);
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found with id: " + classroomId));
        classroom.setIsDeleted(true);
        classroomRepository.save(classroom);
    }

    @Override
    @Transactional(readOnly = true)
    public ClassroomResponse getClassroomById(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found with id: " + classroomId));
        return toResponse(classroom);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomResponse> getAllClassrooms() {
        
        Map<Long, ClassroomRepository.ClassroomCounts> countsById = classroomRepository
                .countSubjectsAndStudentsPerClassroom().stream()
                .collect(Collectors.toMap(ClassroomRepository.ClassroomCounts::getClassroomId, c -> c));

        return classroomRepository.findAllByIsDeletedFalse().stream()
                .map(c -> {
                    ClassroomRepository.ClassroomCounts counts = countsById.get(c.getClassroomId());
                    return toResponse(c,
                            counts != null ? (int) counts.getSubjectCount() : 0,
                            counts != null ? (int) counts.getStudentCount() : 0);
                })
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
    @Transactional(readOnly = true)
    public List<ClassroomSubjectResponse> getClassroomsByLecturerId(Long lecturerId) {
        return classroomSubjectRepository.findByLecturerId(lecturerId)
                .stream()
                .map(this::toClassroomSubjectResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ClassroomSubjectResponse getClassroomSubjectById(Long classroomSubjectId) {
        ClassroomSubject cs = classroomSubjectRepository.findById(classroomSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom-subject not found with id: " + classroomSubjectId));
        return toClassroomSubjectResponse(cs);
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
    @Transactional(readOnly = true)
    public List<SubjectResponse> getSubjectsByLecturerId(Long lecturerId) {
        return classroomSubjectRepository.findByLecturerId(lecturerId)
                .stream()
                .map(cs -> SubjectResponse.from(cs.getSubject()))
                .distinct()
                .collect(Collectors.toList());
    }

    

    private ClassroomResponse toResponse(Classroom classroom) {
        
        int subjectCount = (int) classroomSubjectRepository
                .countByClassroomClassroomId(classroom.getClassroomId());
        int studentCount = (int) classroomSubjectStudentRepository
                .countAllByClassroomId(classroom.getClassroomId());
        return toResponse(classroom, subjectCount, studentCount);
    }

    private ClassroomResponse toResponse(Classroom classroom, int subjectCount, int studentCount) {
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

    private ClassroomSubjectResponse toClassroomSubjectResponse(ClassroomSubject cs) {
        Classroom classroom = cs.getClassroom();
        com.fedu.fedu.entity.Subject subject = cs.getSubject();
        com.fedu.fedu.entity.UserAccount lecturer = cs.getLecturer();

        int studentCount = (int) classroomSubjectStudentRepository
                .countAllByClassroomSubjectId(cs.getId());

        String lecturerName = "";
        if (lecturer != null) {
            String last = lecturer.getLastName() != null ? lecturer.getLastName() : "";
            String first = lecturer.getFirstName() != null ? lecturer.getFirstName() : "";
            lecturerName = (last + " " + first).trim();
            if (lecturerName.isEmpty()) {
                lecturerName = lecturer.getEmail();
            }
        }

        return ClassroomSubjectResponse.builder()
                .classroomSubjectId(cs.getId())
                .classroomId(classroom != null ? classroom.getClassroomId() : null)
                .className(classroom != null ? classroom.getClassName() : null)
                .subjectId(subject != null ? subject.getSubjectId() : null)
                .subjectCode(subject != null ? subject.getSubjectCode() : null)
                .subjectName(subject != null ? subject.getSubjectName() : null)
                .lecturerId(lecturer != null ? lecturer.getUserId() : null)
                .lecturerName(lecturerName)
                .displayName(classroom != null && subject != null 
                        ? classroom.getClassName() + " - " + subject.getSubjectCode() 
                        : null)
                .studentCount(studentCount)
                .build();
    }

    private void assertTeacherOwnsClassroom(Long classroomId) {
        var auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null) return; 
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return;

        UserAccount actor = userAccountRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Unauthorized"));
        if (!classroomSubjectRepository.existsByClassroomClassroomIdAndLecturerUserId(classroomId, actor.getUserId())) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không giảng dạy lớp học này");
        }
    }
}

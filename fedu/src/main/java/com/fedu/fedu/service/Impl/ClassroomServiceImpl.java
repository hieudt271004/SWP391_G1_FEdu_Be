package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.res.ClassroomResponse;
import com.fedu.fedu.dto.res.SubjectResponse;
import com.fedu.fedu.entity.Classroom;
import com.fedu.fedu.repository.ClassroomRepository;
import com.fedu.fedu.service.ClassroomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClassroomServiceImpl implements ClassroomService {

    private final ClassroomRepository classroomRepository;

    @Override
    public List<ClassroomResponse> getClassroomsByLecturerId(Long lecturerId) {
        List<Classroom> classrooms = classroomRepository.findByLecturer_UserIdAndIsDeletedFalse(lecturerId);
        return classrooms.stream()
                .map(this::mapToClassroomResponse)
                .collect(Collectors.toList());
    }

    @Override
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
                .subjectId(classroom.getSubject().getSubjectId())
                .subjectCode(classroom.getSubject().getSubjectCode())
                .subjectName(classroom.getSubject().getSubjectName())
                .lecturerId(classroom.getLecturer().getUserId())
                .lecturerEmail(classroom.getLecturer().getEmail())
                .lecturerFirstName(classroom.getLecturer().getFirstName())
                .lecturerLastName(classroom.getLecturer().getLastName())
                .build();
    }
}

package com.fedu.fedu.service.Impl;

import com.fedu.fedu.entity.Classroom;
import com.fedu.fedu.entity.ClassroomStudent;
import com.fedu.fedu.entity.Student;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomRepository;
import com.fedu.fedu.repository.ClassroomStudentRepository;
import com.fedu.fedu.repository.StudentRepository;
import com.fedu.fedu.service.ClassroomStudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClassroomStudentServiceImpl implements ClassroomStudentService {

    private final ClassroomStudentRepository classroomStudentRepository;
    private final ClassroomRepository classroomRepository;
    private final StudentRepository studentRepository;

    @Override
    public void addStudentToClass(Long classroomId, Long studentId) {
        if (classroomStudentRepository.existsByClassroomIdAndStudentId(classroomId, studentId)) {
            throw new InvalidDataException("Student exist in class.");
        }
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom with ID " + classroomId + " not found"));
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student with ID " + studentId + " not found"));

        ClassroomStudent cs = new ClassroomStudent();
        cs.setClassroom(classroom);
        cs.setStudent(student);
        cs.setJoinedDate(LocalDate.now());

        classroomStudentRepository.save(cs);
    }

    @Override
    public void removeStudentFromClass(Long classroomId, Long studentId) {
        ClassroomStudent cs = classroomStudentRepository.findByClassroomIdAndStudentId(classroomId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student does not exist in classroom"));
        classroomStudentRepository.delete(cs);
    }

    @Override
    public List<ClassroomStudent> getStudentsByClass(Long classroomId) {
        if (!classroomRepository.existsById(classroomId)) {
            throw new ResourceNotFoundException("Classroom with ID " + classroomId + " not found");
        }
        return classroomStudentRepository.findByClassroomId(classroomId);
    }
}

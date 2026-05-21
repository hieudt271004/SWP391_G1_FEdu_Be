package com.fedu.fedu.service.Impl;

import com.fedu.fedu.entity.Student;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.StudentRepository;
import com.fedu.fedu.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;

    @Override
    public Student createStudent(Student student) {
        if (studentRepository.existsByRollNumber(student.getRollNumber())) {
            throw new InvalidDataException("Student with Roll Number " + student.getRollNumber() + " exist.");
        }
        if (studentRepository.existsById(student.getId())) {
            throw new InvalidDataException("Student with Id " + student.getId() + " exist.");
        }
        return studentRepository.save(student);
    }

    @Override
    public Student getStudentById(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Student with Id " + id + " does not exist.");
        }
        return studentRepository.findById(id).get();
    }

    @Override
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    @Override
    public Student updateStudent(long id, Student student) {

        Student existingStudent = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student with Id " + id + " does not exist."));

        if (studentRepository.existsByRollNumber(student.getRollNumber())) {
            throw new ResourceNotFoundException("Roll Number " + student.getRollNumber() + " has been used by another user.");
        }

        existingStudent.setRollNumber(student.getRollNumber());
        existingStudent.setFirstName(student.getFirstName());
        existingStudent.setLastName(student.getLastName());

        return studentRepository.save(existingStudent);
    }

    @Override
    public void deleteStudent(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Student with Id " + id + " does not exist.");
        }
        studentRepository.deleteById(id);
    }
}

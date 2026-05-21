package com.fedu.fedu.service;

import com.fedu.fedu.entity.Student;

import java.util.List;

public interface StudentService {
    Student createStudent(Student student);
    Student getStudentById(Long id);
    List<Student> getAllStudents();
    Student updateStudent(long id, Student student);
    void deleteStudent(Long id);
}

package com.fedu.fedu.service.Impl;

//import com.fedu.fedu.entity.Teacher;
//import com.fedu.fedu.exception.InvalidDataException;
//import com.fedu.fedu.exception.ResourceNotFoundException;
//import com.fedu.fedu.repository.TeacherRepository;
//import com.fedu.fedu.service.TeacherService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//
//import java.util.List;
//
//@Service
//@RequiredArgsConstructor
//public class TeacherServiceImpl implements TeacherService {
//
//    private final TeacherRepository teacherRepository;
//
//    @Override
//    public Teacher createTeacher(Teacher teacher) {
//        if (teacherRepository.existsById(teacher.getId())) {
//            throw new InvalidDataException("Teacher with Id " + teacher.getId() + " exist.");
//        }
//        return teacherRepository.save(teacher);
//    }
//
//    @Override
//    public Teacher getTeacherById(Long id) {
//        if (!teacherRepository.existsById(id)) {
//            throw new ResourceNotFoundException("Teacher with Id " + id + " does not exist.");
//        }
//        return teacherRepository.findById(id).get();
//    }
//
//    @Override
//    public List<Teacher> getAllTeachers() {
//        return teacherRepository.findAll();
//    }
//
//    @Override
//    public Teacher updateTeacher(Long id, Teacher changedDetailTeacher) {
//        Teacher existingTeacher = teacherRepository.findById(id)
//                .orElseThrow(() -> new ResourceNotFoundException("Teacher with Id " + id + " does not exist."));
//
//        existingTeacher.setFirstName(changedDetailTeacher.getFirstName());
//        existingTeacher.setLastName(changedDetailTeacher.getLastName());
//
//        return teacherRepository.save(existingTeacher);
//    }
//
//    @Override
//    public void deleteTeacher(Long id) {
//        if (!teacherRepository.existsById(id)) {
//            throw new ResourceNotFoundException("Teacher with Id " + id + " does not exist.");
//        }
//        teacherRepository.deleteById(id);
//    }
//}

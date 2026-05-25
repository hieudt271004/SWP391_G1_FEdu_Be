package com.fedu.fedu.service;

import com.fedu.fedu.dto.res.ClassroomResponse;
import com.fedu.fedu.dto.res.SubjectResponse;

import java.util.List;

public interface ClassroomService {

    List<ClassroomResponse> getClassroomsByLecturerId(Long lecturerId);

    List<SubjectResponse> getSubjectsByLecturerId(Long lecturerId);
}

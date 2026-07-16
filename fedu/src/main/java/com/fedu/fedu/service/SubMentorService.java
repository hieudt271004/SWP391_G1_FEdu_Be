package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.SubMentorStudentAssignmentRequest;
import com.fedu.fedu.dto.res.SubMentorStudentAssignmentResponse;

import java.util.List;





public interface SubMentorService {

    






    void enableSubMentor(Long classroomSubjectId, Long classroomSubjectStudentId, Long lecturerId);

    






    void disableSubMentor(Long classroomSubjectId, Long classroomSubjectStudentId, Long lecturerId);

    







    SubMentorStudentAssignmentResponse createAssignment(Long classroomSubjectId,
                                                        SubMentorStudentAssignmentRequest request,
                                                        Long lecturerId);

    






    void deleteAssignment(Long classroomSubjectId, Long assignmentId, Long lecturerId);

    


    List<SubMentorStudentAssignmentResponse> listAssignments(Long classroomSubjectId, Long lecturerId);
}

package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.RetakeRequestPayload;
import com.fedu.fedu.dto.req.RetakeResolvePayload;
import com.fedu.fedu.dto.res.RetakeRequestResponse;

import java.util.List;

public interface RetakeRequestService {
    RetakeRequestResponse createRequest(Long studentId, RetakeRequestPayload payload);
    RetakeRequestResponse resolveRequest(Long teacherId, Long requestId, RetakeResolvePayload payload);
    List<RetakeRequestResponse> getStudentRequests(Long studentId, Long classroomSubjectId);
    List<RetakeRequestResponse> getTeacherPendingRequests(Long teacherId, Long classroomSubjectId);
}

package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.SemesterRequest;
import com.fedu.fedu.dto.res.SemesterResponse;

import java.util.List;

public interface SemesterService {
    List<SemesterResponse> getAllSemesters();
    SemesterResponse createSemester(SemesterRequest request);
    SemesterResponse updateSemester(Long id, SemesterRequest request);
    void deleteSemester(Long id);
}

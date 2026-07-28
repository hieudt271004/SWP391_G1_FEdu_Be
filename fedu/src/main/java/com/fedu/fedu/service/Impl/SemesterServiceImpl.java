package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.SemesterRequest;
import com.fedu.fedu.dto.res.SemesterResponse;
import com.fedu.fedu.entity.Semester;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomRepository;
import com.fedu.fedu.repository.SemesterRepository;
import com.fedu.fedu.service.SemesterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SemesterServiceImpl implements SemesterService {

    private final SemesterRepository semesterRepository;
    private final ClassroomRepository classroomRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SemesterResponse> getAllSemesters() {
        return semesterRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SemesterResponse createSemester(SemesterRequest request) {
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new InvalidDataException("Ngày kết thúc phải sau ngày bắt đầu.");
        }

        semesterRepository.findByTermAndAcademicYear(request.getTerm(), request.getAcademicYear())
                .ifPresent(s -> {
                    throw new InvalidDataException("Học kỳ này đã tồn tại trên hệ thống.");
                });

        Semester semester = Semester.builder()
                .term(request.getTerm().trim())
                .academicYear(request.getAcademicYear())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        Semester saved = semesterRepository.save(semester);
        log.info("Created semester: {} {}", saved.getTerm(), saved.getAcademicYear());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public SemesterResponse updateSemester(Long id, SemesterRequest request) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ với ID: " + id));

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new InvalidDataException("Ngày kết thúc phải sau ngày bắt đầu.");
        }

        semesterRepository.findByTermAndAcademicYear(request.getTerm(), request.getAcademicYear())
                .ifPresent(s -> {
                    if (!s.getSemesterId().equals(id)) {
                        throw new InvalidDataException("Học kỳ với tên và năm học này đã tồn tại.");
                    }
                });

        semester.setTerm(request.getTerm().trim());
        semester.setAcademicYear(request.getAcademicYear());
        semester.setStartDate(request.getStartDate());
        semester.setEndDate(request.getEndDate());

        Semester updated = semesterRepository.save(semester);
        log.info("Updated semester ID: {}", updated.getSemesterId());
        return toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteSemester(Long id) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học kỳ với ID: " + id));
        if (classroomRepository.existsBySemester_SemesterId(id)) {
            throw new InvalidDataException("Không thể xóa học kỳ đang được lớp học sử dụng.");
        }
        semesterRepository.delete(semester);
        log.info("Deleted semester ID: {}", id);
    }

    private SemesterResponse toResponse(Semester s) {
        String label = s.getTerm();
        if ("SPRING".equalsIgnoreCase(s.getTerm())) label = "Spring";
        else if ("SUMMER".equalsIgnoreCase(s.getTerm())) label = "Summer";
        else if ("FALL".equalsIgnoreCase(s.getTerm())) label = "Fall";

        return SemesterResponse.builder()
                .semesterId(s.getSemesterId())
                .term(s.getTerm())
                .academicYear(s.getAcademicYear())
                .startDate(s.getStartDate())
                .endDate(s.getEndDate())
                .semesterLabel(label + " " + s.getAcademicYear())
                .build();
    }
}